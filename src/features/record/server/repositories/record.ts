import 'server-only';
import {
  and,
  asc,
  desc,
  eq,
  gte,
  inArray,
  isNotNull,
  isNull,
  lt,
  lte,
  ne,
  or,
  type SQL
} from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { db } from '@/lib/server/db/client';
import {
  colorClassifications,
  methods,
  pairs,
  records,
  subTypes,
  types,
  users
} from '@/lib/server/db/schema';
import { buildScopeWhere } from '@/lib/shared/db/scope';
import {
  startOfMonthJst,
  startOfNextMonthJst,
  toDateStringJst
} from '@/lib/shared/domain/date';
import type { SessionScope } from '@/lib/shared/types/auth';
import type { Id } from '@/lib/shared/types/id';
import { RecordType } from '@/lib/shared/types/recordType';
import {
  resolveScopeLocked,
  toDisplayTypeName,
  toIsInstead,
  toIsSettlement
} from '../../domain/record-fields';
import { SETTLEMENT_DISPLAY } from '../../labels';
import type {
  NoteRecordDefault,
  PairedRecordItem,
  PairUserNames,
  RecordListItem,
  SummarizedRecordItem,
  SummarizedRecordQuery
} from '../../types';

// record レーンのリポジトリ層。

// records への INSERT 入力（定期実体化バッチが使う最小の形）。
// record_type は resolveRecordType 済みの値を渡す前提（呼び出し側が算出する）。
// userId は record_type=10（PAIR/共有財布）の planned_record 実体化で null が入りうる
// ため string | null（user_id は nullable）。
export type RecordInsertInput = {
  userId: string | null;
  pairId: Id | null;
  datetime: Date;
  isPay: boolean | null;
  methodId: Id;
  typeId: Id | null;
  subTypeId: Id | null;
  price: number;
  memo: string | null;
  plannedRecordId: Id | null;
  isSettled: boolean | null;
  recordType: RecordType;
};

// upsertRecord の書き込みフィールド（user_id/pair_id/is_settled/record_type は
// service 層が resolveRecordOwnership で導出済み）。id 有無で insert/update を分ける。
export type RecordUpsertInput = {
  userId: string | null;
  pairId: Id | null;
  datetime: Date;
  isPay: boolean | null;
  methodId: Id;
  typeId: Id | null;
  subTypeId: Id | null;
  price: number;
  memo: string | null;
  isSettled: boolean | null;
  recordType: RecordType;
};

// 取得系の共通 select。マッパーが読む列だけに絞る（method/type の名前＋色名、
// subType 名、ペア相手の user 名。pairs 行自体は使わない＝scalar の pairId で判定する）。
// method と type はそれぞれ別の色行を引くため color_classifications を別名で 2 回 join する。
const methodColor = alias(colorClassifications, 'method_color');
const typeColor = alias(colorClassifications, 'type_color');

const recordColumns = {
  id: records.id,
  userId: records.userId,
  pairId: records.pairId,
  datetime: records.datetime,
  isPay: records.isPay,
  price: records.price,
  memo: records.memo,
  isSettled: records.isSettled,
  recordType: records.recordType,
  plannedRecordId: records.plannedRecordId,
  methodId: records.methodId,
  methodName: methods.name,
  methodColorName: methodColor.name,
  typeId: records.typeId,
  typeName: types.name,
  typeColorName: typeColor.name,
  subTypeId: records.subTypeId,
  subTypeName: subTypes.name,
  userName: users.name
} as const;

// recordColumns を select した 1 行。
type RecordSelectedRow = {
  id: Id;
  userId: string | null;
  pairId: Id | null;
  datetime: Date;
  isPay: boolean | null;
  price: number;
  memo: string | null;
  isSettled: boolean | null;
  recordType: number;
  plannedRecordId: Id | null;
  methodId: Id;
  methodName: string;
  methodColorName: string;
  typeId: Id | null;
  typeName: string | null;
  typeColorName: string | null;
  subTypeId: Id | null;
  subTypeName: string | null;
  userName: string | null;
};

// type / sub_type / user は任意（精算 record は type を持たない）なので左結合する。
//
// 取得系 3 本（カレンダー / 明細 / 精算）はこの select + join を土台に where だけが
// 異なる。isSelf / isPair / pairUserName は user_id・pair_id から TS 側（toOwnership）
// で導出する。
//
//   select records.id, records.user_id, records.pair_id,
//          records.datetime, records.is_pay, records.price, records.memo,
//          records.is_settled, records.record_type, records.planned_record_id,
//          records.method_id, methods.name, method_color.name,
//          records.type_id, types.name, type_color.name,
//          records.sub_type_id, sub_types.name,
//          users.name
//   from records
//   inner join methods on records.method_id = methods.id
//   inner join color_classifications as method_color on
//       methods.color_classification_id = method_color.id
//   left join types on records.type_id = types.id
//   left join color_classifications as type_color on
//       types.color_classification_id = type_color.id
//   left join sub_types on records.sub_type_id = sub_types.id
//   left join users on records.user_id = users.uid
function selectRecords() {
  return db
    .select(recordColumns)
    .from(records)
    .innerJoin(methods, eq(records.methodId, methods.id))
    .innerJoin(methodColor, eq(methods.colorClassificationId, methodColor.id))
    .leftJoin(types, eq(records.typeId, types.id))
    .leftJoin(typeColor, eq(types.colorClassificationId, typeColor.id))
    .leftJoin(subTypes, eq(records.subTypeId, subTypes.id))
    .leftJoin(users, eq(records.userId, users.uid));
}

// smallint の record_type を RecordType(0/5/10/15) へ確定する。DB 制約上この 4 値のみ。
function toRecordType(value: number): RecordType {
  return value as RecordType;
}

// 所有者まわりの導出。閲覧者から見て自分の行か・共有か・立替か・精算か。
// 一覧 DTO とサーバの更新・削除ガードが同じ導出を使う。
function toOwnership(
  row: Pick<RecordSelectedRow, 'userId' | 'pairId' | 'recordType'>,
  userUid: string
): {
  isSelf: boolean;
  isPair: boolean;
  isInstead: boolean | null;
  isSettlement: boolean | null;
} {
  const isPair = row.pairId !== null;
  const recordType = toRecordType(row.recordType);
  return {
    isSelf: row.userId === userUid,
    isPair,
    isInstead: toIsInstead(isPair, recordType),
    isSettlement: toIsSettlement(isPair, recordType)
  };
}

// READ: 期間内 record（カレンダー用）。
//
// selectRecords に足す where:
//
//   where (records.user_id = :userUid or records.pair_id = :pairId)
//       and records.datetime >= :start
//       and records.datetime <= :end
//   order by records.datetime;
export async function getRecordList(
  scope: SessionScope,
  start: Date,
  end: Date
): Promise<RecordListItem[]> {
  const rows = await selectRecords()
    .where(
      and(
        buildScopeWhere(records, scope),
        gte(records.datetime, start),
        lte(records.datetime, end)
      )
    )
    .orderBy(asc(records.datetime));
  return rows.map((row) => toRecordListItem(row, scope.userUid));
}

// READ: 条件検索 record（records 明細画面用）。type 未設定の精算(15)は取得されない。
//
// selectRecords に足す where（target は buildSummarizedTargetWhere、
// pair は buildSummarizedPairWhere が組み立てる）:
//
//   where (records.user_id = :userUid or records.pair_id = :pairId)
//       and records.datetime >= :monthStart
//       and records.datetime < :nextMonthStart
//       and records.type_id is not null
//       and records.is_pay = :isPay
//       and <target>   -- type_id(+sub_type_id) または method_id の一致
//       and <pair>     -- ペア関係 × 立替込みの 4 分岐
//   order by records.datetime desc;
export async function getSummarizedRecordList(
  scope: SessionScope,
  query: SummarizedRecordQuery
): Promise<SummarizedRecordItem[]> {
  const rows = await selectRecords()
    .where(
      and(
        buildScopeWhere(records, scope),
        buildSummarizedYearMonthWhere(query.yearMonth),
        // type 未設定 record（精算 15 等）を除外する。is_pay フィルタ頼みの間接除外では
        // なく、除外意図を明示する。
        isNotNull(records.typeId),
        eq(records.isPay, query.isPay),
        buildSummarizedTargetWhere(query),
        buildSummarizedPairWhere(scope.userUid, query)
      )
    )
    .orderBy(desc(records.datetime));
  return rows.map((row) => toSummarizedRecordItem(row, scope.userUid));
}

// READ: ペアの record（精算画面用）。
//
// selectRecords に足す where:
//
//   where (records.user_id = :userUid or records.pair_id = :pairId)
//       and records.pair_id is not null
//       and records.datetime >= :monthStart
//       and records.datetime < :nextMonthStart
//   order by records.datetime desc;
export async function getPairedRecordList(
  scope: SessionScope,
  yearMonth: string
): Promise<PairedRecordItem[]> {
  const rows = await selectRecords()
    .where(
      and(
        buildScopeWhere(records, scope),
        isNotNull(records.pairId),
        buildSummarizedYearMonthWhere(yearMonth)
      )
    )
    .orderBy(desc(records.datetime));
  return rows.map((row) => toPairedRecordItem(row, scope.userUid));
}

// 取得系: where 断片ヘルパ

// datetime を JST 暦月 [monthStart, nextMonthStart) で絞る。
// 保存も JST の暦日を保つ時刻で行うため、読み取りも date.ts の JST 月境界に揃える
// （UTC 境界だと JST 月初/月末の 9 時間分がズレて集計から漏れ/混入する）。
function buildSummarizedYearMonthWhere(yearMonth: string): SQL {
  return and(
    gte(records.datetime, startOfMonthJst(yearMonth)),
    lt(records.datetime, startOfNextMonthJst(yearMonth))
  ) as SQL;
}

// isType による絞り込み対象（type/sub_type or method）。
function buildSummarizedTargetWhere(query: SummarizedRecordQuery): SQL {
  if (!query.isType) {
    return eq(records.methodId, query.id);
  }
  if (query.subTypeId !== null) {
    return and(
      eq(records.typeId, query.id),
      eq(records.subTypeId, query.subTypeId)
    ) as SQL;
  }
  return eq(records.typeId, query.id);
}

// ペア関係 × 立替込みの絞り込み（4 分岐）。
// - pair && include   : pair_id あり（共有全部）
// - pair && !include   : pair_id あり かつ record_type in (10,15)（立替を除く）
// - !pair && include   : 自分の user_id（個人＋自分の立替＋精算）
// - !pair && !include  : 自分の user_id かつ pair_id なし（純個人のみ）
function buildSummarizedPairWhere(
  userUid: string,
  query: SummarizedRecordQuery
): SQL {
  if (query.isPair && query.isIncludeInstead) {
    return isNotNull(records.pairId);
  }
  if (query.isPair && !query.isIncludeInstead) {
    return and(
      isNotNull(records.pairId),
      inArray(records.recordType, [RecordType.pair, RecordType.settlement])
    ) as SQL;
  }
  if (!query.isPair && query.isIncludeInstead) {
    return eq(records.userId, userUid);
  }
  return and(eq(records.userId, userUid), isNull(records.pairId)) as SQL;
}

// 取得系: 行 → 公開 DTO 変換（BigInt→number 境界）

function toRecordListItem(
  row: RecordSelectedRow,
  userUid: string
): RecordListItem {
  const ownership = toOwnership(row, userUid);
  return {
    id: row.id,
    isSelf: ownership.isSelf,
    datetime: row.datetime,
    isPay: row.isPay,
    price: row.price,
    memo: row.memo,
    recordType: toRecordType(row.recordType),
    plannedRecordId: row.plannedRecordId,
    methodId: row.methodId,
    methodName: row.methodName,
    methodColorClassificationName: row.methodColorName,
    typeId: row.typeId,
    typeName: toDisplayTypeName(row.typeName, toRecordType(row.recordType)),
    subTypeId: row.subTypeId,
    subTypeName: row.subTypeName,
    typeColorClassificationName: row.typeColorName,
    isPair: ownership.isPair,
    // pair_id ありのとき records.user 名を引く（立替者名）。
    pairUserName: ownership.isPair ? row.userName : null,
    isInstead: ownership.isInstead,
    isSettlement: ownership.isSettlement,
    isScopeLocked: resolveScopeLocked({
      isInstead: ownership.isInstead === true,
      isSettled: row.isSettled,
      isSelf: ownership.isSelf
    })
  };
}

function toSummarizedRecordItem(
  row: RecordSelectedRow,
  userUid: string
): SummarizedRecordItem {
  const { isSettlement: _isSettlement, ...item } = toRecordListItem(
    row,
    userUid
  );
  // 明細は精算を where で除外しているので '精算' への名前補完は効かず、生の名前のまま。
  return { ...item, typeName: row.typeName };
}

function toPairedRecordItem(
  row: RecordSelectedRow,
  userUid: string
): PairedRecordItem {
  const recordType = toRecordType(row.recordType);
  return {
    id: row.id,
    datetime: row.datetime,
    isSelf: row.userId === userUid,
    isPay: row.isPay,
    price: row.price,
    memo: row.memo,
    recordType,
    isSettled: row.isSettled,
    isPlannedRecord: row.plannedRecordId !== null,
    methodName: row.methodName,
    methodColorClassificationName: row.methodColorName,
    typeName: row.typeName ?? SETTLEMENT_DISPLAY.name,
    subTypeName: row.subTypeName,
    typeColorClassificationName: row.typeColorName ?? SETTLEMENT_DISPLAY.color,
    isInstead: recordType === RecordType.instead,
    isSettlement: recordType === RecordType.settlement
  };
}

// scope 検証（更新/削除の対象が自分/ペアの行か）

// 指定 record が scope 内か。update / delete の対象確認に使う（他ペアの行を触らせない）。
// datetime は「同月のみ更新可」、isSelf / isInstead は「相手の立替は触らせない」の検証に使う。
export async function findRecordInScope(
  scope: SessionScope,
  id: Id
): Promise<Pick<
  RecordListItem,
  'id' | 'datetime' | 'plannedRecordId' | 'isSelf' | 'isInstead'
> | null> {
  const [row] = await db
    .select({
      id: records.id,
      datetime: records.datetime,
      plannedRecordId: records.plannedRecordId,
      userId: records.userId,
      pairId: records.pairId,
      recordType: records.recordType
    })
    .from(records)
    .where(and(eq(records.id, id), buildScopeWhere(records, scope)))
    .limit(1);
  if (!row) {
    return null;
  }
  const { isSelf, isInstead } = toOwnership(row, scope.userUid);
  return {
    id: row.id,
    datetime: row.datetime,
    plannedRecordId: row.plannedRecordId,
    isSelf,
    isInstead
  };
}

// READ: note（記録編集）の初期値 1 件。scope 内でなければ null。
// isInstead は「共有かつ user_id あり（=立替者が特定されている）」で導出する
// （findPlannedRecordForEdit と同流儀）。datetime は JST 暦日（YYYY-MM-DD）へ丸める。
export async function findRecordForEdit(
  scope: SessionScope,
  id: Id
): Promise<NoteRecordDefault | null> {
  // 精算 record（record_type=15・is_pay=null・type なし）は記録タブで編集できない。
  // UI 前提をデータ層でも保証し、?RECORD=<精算id> の直打ちで壊れた編集フォームが
  // 開くのを防ぐ。
  const [row] = await db
    .select()
    .from(records)
    .where(
      and(
        eq(records.id, id),
        buildScopeWhere(records, scope),
        ne(records.recordType, RecordType.settlement)
      )
    )
    .limit(1);
  if (!row) {
    return null;
  }
  const isPair = row.pairId !== null;
  const isInstead = isPair && row.userId !== null;
  return {
    id: row.id,
    // 記録タブで編集する通常 record は is_pay を持つ（精算は上の where で除外済み）。
    // 型上は nullable のため防御的に true へ寄せる。
    isPay: row.isPay ?? true,
    date: toDateStringJst(row.datetime),
    methodId: row.methodId,
    typeId: row.typeId,
    subTypeId: row.subTypeId,
    memo: row.memo,
    price: row.price,
    isInstead,
    isPair,
    isScopeLocked: resolveScopeLocked({
      isInstead,
      isSettled: row.isSettled,
      isSelf: row.userId === scope.userUid
    }),
    plannedRecordId: row.plannedRecordId
  };
}

// CREATE（まとめ INSERT）。定期実体化（Cron）などから使う。
// scope は所有者確定用（現状は追加検証に使わないが、将来の絞り込み拡張の受け口）。
export async function insertRecords(
  _scope: SessionScope,
  inputs: RecordInsertInput[]
): Promise<void> {
  if (inputs.length === 0) {
    return;
  }
  await db.insert(records).values(
    inputs.map((input) => ({
      userId: input.userId,
      pairId: input.pairId,
      datetime: input.datetime,
      isPay: input.isPay,
      methodId: input.methodId,
      typeId: input.typeId,
      subTypeId: input.subTypeId,
      price: input.price,
      memo: input.memo,
      plannedRecordId: input.plannedRecordId,
      isSettled: input.isSettled,
      recordType: input.recordType
    }))
  );
}

// records.user_id は nullable のため、PAIR（record_type=10・共有かつ非立替）record の
//   user_id=null をそのまま書ける。所有列（user_id/pair_id/is_settled/record_type）は
//   service が resolveRecordOwnership 済み。

// CREATE（1 件）。note の新規登録。所有列は service が resolveRecordOwnership 済み。
export async function insertRecord(input: RecordUpsertInput): Promise<void> {
  await db.insert(records).values({
    userId: input.userId,
    pairId: input.pairId,
    datetime: input.datetime,
    isPay: input.isPay,
    methodId: input.methodId,
    typeId: input.typeId,
    subTypeId: input.subTypeId,
    price: input.price,
    memo: input.memo,
    isSettled: input.isSettled,
    recordType: input.recordType
  });
}

// UPDATE（1 件）。対象が scope 内であることは service 層で検証済み前提。
// 共有↔個人の切替で user_id を NULL 化しうるため明示的に全列を上書きする。
export async function updateRecord(
  id: Id,
  input: RecordUpsertInput
): Promise<void> {
  await db
    .update(records)
    .set({
      userId: input.userId,
      pairId: input.pairId,
      datetime: input.datetime,
      isPay: input.isPay,
      methodId: input.methodId,
      typeId: input.typeId,
      subTypeId: input.subTypeId,
      price: input.price,
      memo: input.memo,
      isSettled: input.isSettled,
      recordType: input.recordType
    })
    .where(eq(records.id, id));
}

// 自分が当事者である pair に限定する（他人同士の pair を引かない）。
function buildPairMemberWhere(userUid: string): SQL {
  return or(eq(pairs.user1Id, userUid), eq(pairs.user2Id, userUid)) as SQL;
}

// 精算の相手 user_id を引く。受取（!isPay）の精算 record は「相手が負担」する
// ため user_id に相手を入れる。session.pairId で自分のペアに限定して照会する
// （scope: 自分が当事者でない pair は引かない）。相手が定まらなければ null。
export async function findCounterpartUserId(
  scope: SessionScope,
  pairId: Id
): Promise<string | null> {
  const [pair] = await db
    .select({ user1Id: pairs.user1Id, user2Id: pairs.user2Id })
    .from(pairs)
    .where(and(eq(pairs.id, pairId), buildPairMemberWhere(scope.userUid)))
    .limit(1);
  if (!pair) {
    return null;
  }
  return pair.user1Id === scope.userUid ? pair.user2Id : pair.user1Id;
}

// ペアの 2 人の名前を引く。findCounterpartUserId と同じく session.pairId で
// 自分のペアに限定する。
export async function findPairUserNames(
  scope: SessionScope,
  pairId: Id
): Promise<PairUserNames | null> {
  const user1 = alias(users, 'user1');
  const user2 = alias(users, 'user2');
  const [pair] = await db
    .select({
      user1Id: pairs.user1Id,
      user1Name: user1.name,
      user2Name: user2.name
    })
    .from(pairs)
    .innerJoin(user1, eq(pairs.user1Id, user1.uid))
    .innerJoin(user2, eq(pairs.user2Id, user2.uid))
    .where(and(eq(pairs.id, pairId), buildPairMemberWhere(scope.userUid)))
    .limit(1);
  if (!pair) {
    return null;
  }
  const isUser1 = pair.user1Id === scope.userUid;
  return {
    self: isUser1 ? pair.user1Name : pair.user2Name,
    partner: isUser1 ? pair.user2Name : pair.user1Name
  };
}

// CREATE（精算 record）。record_type=15・is_pay=null・type なし。
// user_id は「精算を負担する側」= 支払時は自分、受取時は相手（service が解決）。
export async function insertSettlementRecord(input: {
  userId: string;
  pairId: Id;
  datetime: Date;
  methodId: Id;
  price: number;
}): Promise<void> {
  await db.insert(records).values({
    userId: input.userId,
    pairId: input.pairId,
    datetime: input.datetime,
    isPay: null,
    methodId: input.methodId,
    typeId: null,
    subTypeId: null,
    price: input.price,
    memo: null,
    isSettled: null,
    recordType: RecordType.settlement
  });
}

// UPDATE（一括精算）。scope を where に AND し、更新できた件数を返す
// （scope 保証を mutation の DB 条件に閉じ込める。IDOR 防御）。
export async function markRecordsSettled(
  scope: SessionScope,
  ids: Id[]
): Promise<number> {
  const updated = await db
    .update(records)
    .set({ isSettled: true })
    .where(and(inArray(records.id, ids), buildScopeWhere(records, scope)))
    .returning({ id: records.id });
  return updated.length;
}

// DELETE（1 件）。scope を where に AND し、削除できたかを返す
// （scope 外の行は 0 件で notFound）。
export async function deleteRecordById(
  scope: SessionScope,
  id: Id
): Promise<{ ok: true } | { ok: false; error: 'notFound' }> {
  const deleted = await db
    .delete(records)
    .where(and(eq(records.id, id), buildScopeWhere(records, scope)))
    .returning({ id: records.id });
  if (deleted.length === 0) {
    return { ok: false, error: 'notFound' };
  }
  return { ok: true };
}

// READ: 組み合わせ（収支 × 個人/共有 × 立替）ごとに直近 1 件の method_id。
// 入力フローの方法の初期選択に使う。組み合わせごとに findFirst を並べるのは、
// 1 クエリの groupBy では「集まりごとに最新の 1 行」を取れないため（集約関数は
// max(datetime) までしか返せず、その行の method_id は引けない）。
