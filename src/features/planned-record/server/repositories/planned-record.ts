import 'server-only';
import { prisma } from '@/lib/server/db/client';
import { buildScopeWhere } from '@/lib/shared/db/scope';
import type { SortAssignment } from '@/lib/shared/domain/reorder';
import type { SessionScope } from '@/lib/shared/types/auth';
import type { Id } from '@/lib/shared/types/id';
import type { RecordType } from '@/lib/shared/types/recordType';
import type { Prisma } from '@/prisma/generated/client';
import type {
  NotePlannedRecordDefault,
  PlannedRecordListItem
} from '../../types';

// planned_records.id は serial Int（BigInt でない）ため id 変換は不要。

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

// マッパーが読む列だけ select で絞る
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

// READ: 定期一覧（設定タブ用）。
// self/pair の分けは service 側のグルーピングで行い、ここは各グループ内の sort 昇順のみ担う。
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
    // pair_id ありのときのみ立替者名を引く。
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

// READ: 定期編集の初期値 1 件。scope 内でなければ null。
// isInstead は「共有かつ user_id あり（=立替者が特定されている）」で導出する。
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

// scope 検証: 指定 planned_record が scope 内か。update の対象確認に使う
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
// （scope 外の行は count===0 で notFound）。
//
// 実体化済み record は残す（「これまでに記録された分は残ります」）。records の
// planned_record_id を先に NULL にしてから消すので、FK 制約に当たらない。
// 2 つの更新は同じトランザクションで行い、NULL 化だけ済んで削除に失敗する状態を作らない。
// records 側の scope は定期と同じ所有（個人なら user_id、共有なら pair_id）なので
// buildScopeWhere でそのまま絞れる。
export async function deletePlannedRecordById(
  scope: SessionScope,
  id: Id
): Promise<{ ok: true } | { ok: false; error: 'notFound' }> {
  return prisma.$transaction(async (tx) => {
    const target = await tx.plannedRecord.findFirst({
      where: { AND: [{ id }, buildScopeWhere(scope)] },
      select: { id: true }
    });
    if (target === null) {
      return { ok: false, error: 'notFound' };
    }
    await tx.record.updateMany({
      where: { AND: [{ plannedRecordId: id }, buildScopeWhere(scope)] },
      data: { plannedRecordId: null }
    });
    await tx.plannedRecord.delete({ where: { id } });
    return { ok: true };
  });
}

// REORDER（任意順）。集まり（pairId）の検証は service 層で行う。
export async function findPlannedRecordRowsForReorder(
  scope: SessionScope,
  ids: Id[]
): Promise<{ id: Id; sort: number; pairId: Id | null }[]> {
  return prisma.plannedRecord.findMany({
    where: { AND: [{ id: { in: ids } }, buildScopeWhere(scope)] },
    select: { id: true, sort: true, pairId: true }
  });
}

export async function updatePlannedRecordSorts(
  assignments: SortAssignment[]
): Promise<void> {
  await prisma.$transaction(
    assignments.map(({ id, sort }) =>
      prisma.plannedRecord.update({ where: { id }, data: { sort } })
    )
  );
}
