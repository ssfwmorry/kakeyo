import 'server-only';
import { prisma } from '@/lib/server/db/client';
import { buildScopeWhere } from '@/lib/shared/db/scope';
import type { SortAssignment } from '@/lib/shared/domain/reorder';
import type { SessionScope } from '@/lib/shared/types/auth';
import type { Id } from '@/lib/shared/types/id';

// plan_type リポジトリ（一覧取得 / 並べ替え / upsert / 削除）。plan_type は
// user_id / pair_id のどちらか一方を持つため、
// 取得は pair 込みの buildScopeWhere を使う。

// 画面用の plan_type 行（色名・sort・is_pair 判定に必要な列込み）。
export type PlanTypeRow = {
  id: Id;
  name: string;
  sort: number;
  colorClassificationId: Id;
  colorName: string;
  pairId: Id | null;
};

// READ（画面用）。色名を結合し sort 昇順で返す。is_pair は pairId の有無で判定。
export async function findPlanTypeRows(
  scope: SessionScope
): Promise<PlanTypeRow[]> {
  const rows = await prisma.planType.findMany({
    where: buildScopeWhere(scope),
    include: { colorClassification: { select: { name: true } } },
    // is_pair, sort 順で並べる。self（pairId=null）を先に、次に sort。
    orderBy: [{ pairId: 'asc' }, { sort: 'asc' }]
  });
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    sort: row.sort,
    colorClassificationId: row.colorClassificationId,
    colorName: row.colorClassification.name,
    pairId: row.pairId
  }));
}

// scope 検証: 指定 plan_type が scope 内か。update / delete の対象確認に使う。
export async function findPlanTypeInScope(
  scope: SessionScope,
  id: Id
): Promise<{ id: Id; sort: number; pairId: Id | null } | null> {
  return prisma.planType.findFirst({
    where: { AND: [{ id }, buildScopeWhere(scope)] },
    select: { id: true, sort: true, pairId: true }
  });
}

export async function insertPlanType(input: {
  name: string;
  colorClassificationId: Id;
  userId: string | null;
  pairId: Id | null;
}): Promise<void> {
  await prisma.planType.create({
    data: {
      name: input.name,
      colorClassificationId: input.colorClassificationId,
      userId: input.userId,
      pairId: input.pairId
    }
  });
}

// UPDATE（名前・色のみ。所有列 user_id/pair_id は変えない）。
export async function updatePlanType(input: {
  id: Id;
  name: string;
  colorClassificationId: Id;
}): Promise<void> {
  await prisma.planType.update({
    where: { id: input.id },
    data: {
      name: input.name,
      colorClassificationId: input.colorClassificationId
    }
  });
}

export async function deletePlanTypeById(id: Id): Promise<void> {
  await prisma.planType.delete({ where: { id } });
}

// REORDER（任意順）。集まり（pairId）の検証は service 層で行う。
export async function findPlanTypeRowsForReorder(
  scope: SessionScope,
  ids: Id[]
): Promise<{ id: Id; sort: number; pairId: Id | null }[]> {
  return prisma.planType.findMany({
    where: { AND: [{ id: { in: ids } }, buildScopeWhere(scope)] },
    select: { id: true, sort: true, pairId: true }
  });
}

export async function updatePlanTypeSorts(
  assignments: SortAssignment[]
): Promise<void> {
  await prisma.$transaction(
    assignments.map(({ id, sort }) =>
      prisma.planType.update({ where: { id }, data: { sort } })
    )
  );
}
