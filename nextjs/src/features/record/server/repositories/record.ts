import 'server-only';
import { prisma } from '@/lib/server/db/client';
import { buildScopeWhere } from '@/lib/shared/db/scope';
import {
  startOfMonthJst,
  startOfNextMonthJst,
  toDateStringJst
} from '@/lib/shared/domain/date';
import type { SessionScope } from '@/lib/shared/types/auth';
import type { Id } from '@/lib/shared/types/id';
import { RecordType } from '@/lib/shared/types/recordType';
import type { Prisma } from '@/prisma/generated/client';
import { SETTLEMENT_DISPLAY } from '../../labels';
import type {
  NoteRecordDefault,
  PairedRecordItem,
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

// 取得系の共通 include。マッパーが読む列だけを select で絞る（method/type の名前＋色名、
// subType 名、ペア相手の user 名。pair 行自体は使わない＝scalar の pairId で判定するため
// include しない）。
const recordInclude = {
  method: {
    select: { name: true, colorClassification: { select: { name: true } } }
  },
  type: {
    select: { name: true, colorClassification: { select: { name: true } } }
  },
  subType: { select: { name: true } },
  user: { select: { name: true } }
} satisfies Prisma.RecordInclude;

type RecordWithRelations = Prisma.RecordGetPayload<{
  include: typeof recordInclude;
}>;

// smallint の record_type を RecordType(0/5/10/15) へ確定する。DB 制約上この 4 値のみ。
function toRecordType(value: number): RecordType {
  return value as RecordType;
}

// 共有 record かどうか（pair_id の有無）。
function isPairRecord(row: RecordWithRelations): boolean {
  return row.pairId !== null;
}

// READ: 期間内 record（カレンダー用）。
// datetime は [start, end]（両端含む）で絞る。scope は自分 or ペア。
export async function getRecordList(
  scope: SessionScope,
  start: Date,
  end: Date
): Promise<RecordListItem[]> {
  const rows = await prisma.record.findMany({
    where: {
      AND: [buildScopeWhere(scope), { datetime: { gte: start, lte: end } }]
    },
    include: recordInclude,
    orderBy: { datetime: 'asc' }
  });
  return rows.map((row) => toRecordListItem(row, scope.userUid));
}

// READ: 条件検索 record（records 明細画面用）。
// 精算(15)は取得されない。ペア関係 × 立替込みの分岐は where で表現する。
export async function getSummarizedRecordList(
  scope: SessionScope,
  query: SummarizedRecordQuery
): Promise<SummarizedRecordItem[]> {
  const rows = await prisma.record.findMany({
    where: {
      AND: [
        buildScopeWhere(scope),
        buildSummarizedYearMonthWhere(query.yearMonth),
        // type 未設定 record（精算 15 等）を除外する。is_pay フィルタ頼みの間接除外では
        // なく、除外意図を明示する。
        { typeId: { not: null } },
        { isPay: query.isPay },
        buildSummarizedTargetWhere(query),
        buildSummarizedPairWhere(scope.userUid, query)
      ]
    },
    include: recordInclude,
    orderBy: { datetime: 'desc' }
  });
  return rows.map((row) => toSummarizedRecordItem(row, scope.userUid));
}

// READ: ペアの record（精算画面用）。
// pair_id を持つ record のみ。scope で自分のペアに限定。
export async function getPairedRecordList(
  scope: SessionScope,
  yearMonth: string
): Promise<PairedRecordItem[]> {
  const rows = await prisma.record.findMany({
    where: {
      AND: [
        buildScopeWhere(scope),
        { pairId: { not: null } },
        buildSummarizedYearMonthWhere(yearMonth)
      ]
    },
    include: recordInclude,
    orderBy: { datetime: 'desc' }
  });
  return rows.map((row) => toPairedRecordItem(row, scope.userUid));
}

// 取得系: where 断片ヘルパ

// datetime を JST 暦月 [monthStart, nextMonthStart) で絞る。
// 保存も startOfDayJst（JST 0:00）で行うため、読み取りも date.ts の JST 月境界に揃える
// （UTC 境界だと JST 月初/月末の 9 時間分がズレて集計から漏れ/混入する）。
function buildSummarizedYearMonthWhere(
  yearMonth: string
): Prisma.RecordWhereInput {
  return {
    datetime: {
      gte: startOfMonthJst(yearMonth),
      lt: startOfNextMonthJst(yearMonth)
    }
  };
}

// isType による絞り込み対象（type/sub_type or method）。
function buildSummarizedTargetWhere(
  query: SummarizedRecordQuery
): Prisma.RecordWhereInput {
  if (!query.isType) {
    return { methodId: query.id };
  }
  if (query.subTypeId !== null) {
    return { AND: [{ typeId: query.id }, { subTypeId: query.subTypeId }] };
  }
  return { typeId: query.id };
}

// ペア関係 × 立替込みの絞り込み（4 分岐）。
// - pair && include   : pair_id あり（共有全部）
// - pair && !include   : pair_id あり かつ record_type in (10,15)（立替を除く）
// - !pair && include   : 自分の user_id（個人＋自分の立替＋精算）
// - !pair && !include  : 自分の user_id かつ pair_id なし（純個人のみ）
function buildSummarizedPairWhere(
  userUid: string,
  query: SummarizedRecordQuery
): Prisma.RecordWhereInput {
  if (query.isPair && query.isIncludeInstead) {
    return { pairId: { not: null } };
  }
  if (query.isPair && !query.isIncludeInstead) {
    return {
      AND: [
        { pairId: { not: null } },
        { recordType: { in: [RecordType.pair, RecordType.settlement] } }
      ]
    };
  }
  if (!query.isPair && query.isIncludeInstead) {
    return { userId: userUid };
  }
  return { AND: [{ userId: userUid }, { pairId: null }] };
}

// 取得系: 行 → 公開 DTO 変換（BigInt→number 境界）

// 立替かどうか（個人 record は判定不能のため null）。
function toIsInstead(isPair: boolean, recordType: RecordType): boolean | null {
  if (!isPair) {
    return null;
  }
  return recordType === RecordType.instead;
}

// 精算かどうか（個人 record は null）。
function toIsSettlement(
  isPair: boolean,
  recordType: RecordType
): boolean | null {
  if (!isPair) {
    return null;
  }
  return recordType === RecordType.settlement;
}

// type 名の表示補完（type 未設定 or 精算は '精算'）。
function toDisplayTypeName(
  typeName: string | null,
  recordType: RecordType
): string | null {
  if (typeName === null || recordType === RecordType.settlement) {
    return SETTLEMENT_DISPLAY.name;
  }
  return typeName;
}

function toRecordListItem(
  row: RecordWithRelations,
  userUid: string
): RecordListItem {
  const isPair = isPairRecord(row);
  const recordType = toRecordType(row.recordType);
  return {
    id: Number(row.id),
    isSelf: row.userId === userUid,
    datetime: row.datetime,
    isPay: row.isPay,
    price: row.price,
    memo: row.memo,
    recordType,
    plannedRecordId: row.plannedRecordId,
    methodId: row.methodId,
    methodName: row.method.name,
    methodColorClassificationName: row.method.colorClassification.name,
    typeId: row.typeId,
    typeName: toDisplayTypeName(row.type?.name ?? null, recordType),
    subTypeId: row.subTypeId,
    subTypeName: row.subType?.name ?? null,
    typeColorClassificationName: row.type?.colorClassification.name ?? null,
    isPair,
    // pair_id ありのとき records.user 名を引く（立替者名）。
    pairUserName: isPair ? (row.user?.name ?? null) : null,
    isInstead: toIsInstead(isPair, recordType),
    isSettlement: toIsSettlement(isPair, recordType)
  };
}

function toSummarizedRecordItem(
  row: RecordWithRelations,
  userUid: string
): SummarizedRecordItem {
  const isPair = isPairRecord(row);
  const recordType = toRecordType(row.recordType);
  return {
    id: Number(row.id),
    isSelf: row.userId === userUid,
    datetime: row.datetime,
    isPay: row.isPay,
    price: row.price,
    memo: row.memo,
    recordType,
    plannedRecordId: row.plannedRecordId,
    methodId: row.methodId,
    methodName: row.method.name,
    methodColorClassificationName: row.method.colorClassification.name,
    typeId: row.typeId,
    typeName: row.type?.name ?? null,
    subTypeId: row.subTypeId,
    subTypeName: row.subType?.name ?? null,
    typeColorClassificationName: row.type?.colorClassification.name ?? null,
    isPair,
    pairUserName: isPair ? (row.user?.name ?? null) : null,
    isInstead: toIsInstead(isPair, recordType)
  };
}

function toPairedRecordItem(
  row: RecordWithRelations,
  userUid: string
): PairedRecordItem {
  const recordType = toRecordType(row.recordType);
  return {
    id: Number(row.id),
    datetime: row.datetime,
    isSelf: row.userId === userUid,
    isPay: row.isPay,
    price: row.price,
    memo: row.memo,
    recordType,
    isSettled: row.isSettled,
    isPlannedRecord: row.plannedRecordId !== null,
    methodName: row.method.name,
    methodColorClassificationName: row.method.colorClassification.name,
    typeName: row.type?.name ?? SETTLEMENT_DISPLAY.name,
    subTypeName: row.subType?.name ?? null,
    typeColorClassificationName:
      row.type?.colorClassification.name ?? SETTLEMENT_DISPLAY.color,
    isInstead: recordType === RecordType.instead,
    isSettlement: recordType === RecordType.settlement
  };
}

// scope 検証（更新/削除の対象が自分/ペアの行か）

// 指定 record が scope 内か。update / delete / settle の対象確認に使う
// （他ペアの行を触らせない）。datetime は「同月のみ更新可」検証に使う。
export async function findRecordInScope(
  scope: SessionScope,
  id: Id
): Promise<{ id: Id; datetime: Date; plannedRecordId: Id | null } | null> {
  const row = await prisma.record.findFirst({
    where: { AND: [{ id }, buildScopeWhere(scope)] },
    select: { id: true, datetime: true, plannedRecordId: true }
  });
  if (!row) {
    return null;
  }
  return {
    id: Number(row.id),
    datetime: row.datetime,
    plannedRecordId: row.plannedRecordId
  };
}

// READ: note（記録編集）の初期値 1 件。scope 内でなければ null。
// isInstead は「共有かつ user_id あり（=立替者が特定されている）」で導出する
// （findPlannedRecordForEdit と同流儀）。datetime は JST 暦日（YYYY-MM-DD）へ丸める。
export async function findRecordForEdit(
  scope: SessionScope,
  id: Id
): Promise<NoteRecordDefault | null> {
  const row = await prisma.record.findFirst({
    // 精算 record（record_type=15・is_pay=null・type なし）は記録タブで編集できない。
    // UI 前提をデータ層でも保証し、?RECORD=<精算id> の直打ちで壊れた編集フォームが
    // 開くのを防ぐ。
    where: {
      AND: [
        { id },
        buildScopeWhere(scope),
        { recordType: { not: RecordType.settlement } }
      ]
    }
  });
  if (!row) {
    return null;
  }
  const isPair = row.pairId !== null;
  return {
    id: Number(row.id),
    // 記録タブで編集する通常 record は is_pay を持つ（精算は上の where で除外済み）。
    // 型上は nullable のため防御的に true へ寄せる。
    isPay: row.isPay ?? true,
    date: toDateStringJst(row.datetime),
    methodId: row.methodId,
    typeId: row.typeId,
    subTypeId: row.subTypeId,
    memo: row.memo,
    price: row.price,
    isInstead: isPair && row.userId !== null
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
  await prisma.record.createMany({
    data: inputs.map((input) => ({
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
  });
}

// records.user_id は nullable のため、PAIR（record_type=10・共有かつ非立替）record の
//   user_id=null を型付き create/update でそのまま書ける。所有列（user_id/pair_id/
//   is_settled/record_type）は service が resolveRecordOwnership 済み。

// CREATE（1 件）。note の新規登録。所有列は service が resolveRecordOwnership 済み。
export async function insertRecord(input: RecordUpsertInput): Promise<void> {
  await prisma.record.create({
    data: {
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
    }
  });
}

// UPDATE（1 件）。対象が scope 内であることは service 層で検証済み前提。
// 共有↔個人の切替で user_id を NULL 化しうるため明示的に全列を上書きする。
export async function updateRecord(
  id: Id,
  input: RecordUpsertInput
): Promise<void> {
  await prisma.record.update({
    where: { id },
    data: {
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
    }
  });
}

// 精算の相手 user_id を引く。受取（!isPay）の精算 record は「相手が負担」する
// ため user_id に相手を入れる。session.pairId で自分のペアに限定して照会する
// （scope: 自分が当事者でない pair は引かない）。相手が定まらなければ null。
export async function findCounterpartUserId(
  scope: SessionScope,
  pairId: Id
): Promise<string | null> {
  const pair = await prisma.pair.findFirst({
    where: {
      AND: [
        { id: pairId },
        { OR: [{ user1Id: scope.userUid }, { user2Id: scope.userUid }] }
      ]
    },
    select: { user1Id: true, user2Id: true }
  });
  if (!pair) {
    return null;
  }
  return pair.user1Id === scope.userUid ? pair.user2Id : pair.user1Id;
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
  await prisma.record.create({
    data: {
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
    }
  });
}

// UPDATE（一括精算）。scope を where に AND し、更新できた件数を返す
// （scope 保証を mutation の DB 条件に閉じ込める。IDOR 防御）。
export async function markRecordsSettled(
  scope: SessionScope,
  ids: Id[]
): Promise<number> {
  const result = await prisma.record.updateMany({
    where: { AND: [{ id: { in: ids } }, buildScopeWhere(scope)] },
    data: { isSettled: true }
  });
  return result.count;
}

// DELETE（1 件）。scope を where に AND し、削除できたかを返す
// （scope 外の行は count===0 で notFound）。
export async function deleteRecordById(
  scope: SessionScope,
  id: Id
): Promise<{ ok: true } | { ok: false; error: 'notFound' }> {
  const result = await prisma.record.deleteMany({
    where: { AND: [{ id }, buildScopeWhere(scope)] }
  });
  if (result.count === 0) {
    return { ok: false, error: 'notFound' };
  }
  return { ok: true };
}
