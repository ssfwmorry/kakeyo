import 'server-only';
import { prisma } from '@/lib/server/db/client';
import { buildScopeWhere } from '@/lib/shared/db/scope';
import type { SessionScope } from '@/lib/shared/types/auth';
import type { Id } from '@/lib/shared/types/id';
import type { RecordType } from '@/lib/shared/types/recordType';
import type { Prisma } from '@/prisma/generated/client';
import type {
  NotePlannedRecordDefault,
  PlannedRecordListItem
} from '../../types';

// planned-record レーンのリポジトリ層。planned_records.id は serial Int（BigInt でない）
// ため id 変換は不要。取得はグループ A（get_planned_record_list を Prisma ORM の include で
// 移植）、swap はグループ B（swap_planned_record を $transaction の 2 行 sort 入替で移植）。
// 実体化バッチ（post_records・グループ C）は services 側で $queryRaw 移植する。

// planned_records への書き込みフィールド（user_id/pair_id/record_type は
// service 層が resolvePlannedRecordOwnership で導出済み）。id 有無で insert/update を分ける。
export type PlannedRecordUpsertFields = {
  userId: string | null;
  pairId: Id | null;
  dayClassificationId: Id;
  isPay: boolean;
  methodId: Id;
  typeId: Id;
  subTypeId: Id | null;
  price: number;
  memo: string | null;
  recordType: RecordType;
};

// 取得系（グループ A: Prisma ORM）

// get_planned_record_list の include。マッパーが読む列だけ select で絞る
// （day 名、method/type の名前＋色名、subType 名、立替者の user 名）。
const plannedRecordInclude = {
  dayClassification: { select: { name: true } },
  method: {
    select: { name: true, colorClassification: { select: { name: true } } }
  },
  type: {
    select: { name: true, colorClassification: { select: { name: true } } }
  },
  subType: { select: { name: true } },
  user: { select: { name: true } }
} satisfies Prisma.PlannedRecordInclude;

type PlannedRecordWithRelations = Prisma.PlannedRecordGetPayload<{
  include: typeof plannedRecordInclude;
}>;

// READ: 定期一覧（設定タブ用）。get_planned_record_list を Prisma ORM で移植。
// 旧 SQL の order by is_pair, sort は「self/pair 分けは service 側のグルーピング、
// 各グループ内は sort 昇順」に対応する。
export async function findPlannedRecordRows(
  scope: SessionScope
): Promise<PlannedRecordListItem[]> {
  const rows = await prisma.plannedRecord.findMany({
    where: buildScopeWhere(scope),
    include: plannedRecordInclude,
    orderBy: { sort: 'asc' }
  });
  return rows.map((row) => toPlannedRecordListItem(row, scope.userUid));
}

function toPlannedRecordListItem(
  row: PlannedRecordWithRelations,
  userUid: string
): PlannedRecordListItem {
  const isPair = row.pairId !== null;
  return {
    id: row.id,
    isSelf: row.userId === userUid,
    isPay: row.isPay,
    price: row.price,
    memo: row.memo,
    sort: row.sort,
    isPair,
    // 旧 RPC は pair_id ありのときのみ users.name を引く（立替者名）。
    pairUserName: isPair ? (row.user?.name ?? null) : null,
    dayClassificationId: row.dayClassificationId,
    dayClassificationName: row.dayClassification.name,
    methodId: row.methodId,
    methodName: row.method.name,
    methodColorClassificationName: row.method.colorClassification.name,
    typeId: row.typeId,
    typeName: row.type.name,
    typeColorClassificationName: row.type.colorClassification.name,
    subTypeId: row.subTypeId,
    subTypeName: row.subType?.name ?? null
  };
}

// READ: note（定期編集）の初期値 1 件。scope 内でなければ null。
// isInstead は旧 note の `!!plannedRecord.pairUserName` と等価な
// 「共有かつ user_id あり（=立替者が特定されている）」で導出する。
export async function findPlannedRecordForEdit(
  scope: SessionScope,
  id: Id
): Promise<NotePlannedRecordDefault | null> {
  const row = await prisma.plannedRecord.findFirst({
    where: { AND: [{ id }, buildScopeWhere(scope)] }
  });
  if (!row) {
    return null;
  }
  const isPair = row.pairId !== null;
  return {
    id: row.id,
    isPay: row.isPay,
    dayClassificationId: row.dayClassificationId,
    methodId: row.methodId,
    typeId: row.typeId,
    subTypeId: row.subTypeId,
    memo: row.memo,
    price: row.price,
    isInstead: isPair && row.userId !== null,
    isPair
  };
}

// scope 検証: 指定 planned_record が scope 内か。update / swap の対象確認に使う
// （他ペアの行を触らせない）。
export async function findPlannedRecordInScope(
  scope: SessionScope,
  id: Id
): Promise<{ id: Id; sort: number } | null> {
  return prisma.plannedRecord.findFirst({
    where: { AND: [{ id }, buildScopeWhere(scope)] },
    select: { id: true, sort: true }
  });
}

// CREATE。所有列（user_id/pair_id/record_type）は service が導出済み。
export async function insertPlannedRecord(
  input: PlannedRecordUpsertFields
): Promise<void> {
  await prisma.plannedRecord.create({
    data: {
      userId: input.userId,
      pairId: input.pairId,
      dayClassificationId: input.dayClassificationId,
      isPay: input.isPay,
      methodId: input.methodId,
      typeId: input.typeId,
      subTypeId: input.subTypeId,
      price: input.price,
      memo: input.memo,
      recordType: input.recordType
    }
  });
}

// UPDATE。対象が scope 内であることは service 層で検証済み前提。
// 共有↔個人・立替切替で user_id / pair_id を NULL 化しうるため明示的に全列を上書きする。
export async function updatePlannedRecord(
  id: Id,
  input: PlannedRecordUpsertFields
): Promise<void> {
  await prisma.plannedRecord.update({
    where: { id },
    data: {
      userId: input.userId,
      pairId: input.pairId,
      dayClassificationId: input.dayClassificationId,
      isPay: input.isPay,
      methodId: input.methodId,
      typeId: input.typeId,
      subTypeId: input.subTypeId,
      price: input.price,
      memo: input.memo,
      recordType: input.recordType
    }
  });
}

// DELETE（1 件）。scope を where に AND し、削除できたかを返す
// （bank/memo/record と同パターン。scope 外の行は count===0 で notFound）。
// 実体化済み record が紐づく場合は FK 制約違反（P2003）が throw される
// （呼び出し側 service が foreignKey へ分類する。旧 FE の 23503 判定に対応）。
export async function deletePlannedRecordById(
  scope: SessionScope,
  id: Id
): Promise<{ ok: true } | { ok: false; error: 'notFound' }> {
  const result = await prisma.plannedRecord.deleteMany({
    where: { AND: [{ id }, buildScopeWhere(scope)] }
  });
  if (result.count === 0) {
    return { ok: false, error: 'notFound' };
  }
  return { ok: true };
}

// SWAP（グループ B: swap_planned_record 相当）

// 2 行の sort を入替（旧 RPC swap_planned_record の update ... from 相当を
// $transaction の 2 update で移植。type-method / plan-reminder の swap と同流儀）。
// 両行が scope 内であることは service 層で検証済み前提。
export async function swapPlannedRecordSort(
  a: { id: Id; sort: number },
  b: { id: Id; sort: number }
): Promise<void> {
  await prisma.$transaction([
    prisma.plannedRecord.update({
      where: { id: a.id },
      data: { sort: b.sort }
    }),
    prisma.plannedRecord.update({ where: { id: b.id }, data: { sort: a.sort } })
  ]);
}
