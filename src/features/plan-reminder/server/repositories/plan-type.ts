import 'server-only';
import { and, asc, eq, inArray } from 'drizzle-orm';
import { db } from '@/lib/server/db/client';
import { colorClassifications, planTypes } from '@/lib/server/db/schema';
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

// READ（画面用）。isPair は pairId の有無で呼び出し側が判定する。
//
// 組み立てられる SQL:
//
//   select plan_types.id, plan_types.name, plan_types.sort,
//          plan_types.color_classification_id,
//          color_classifications.name as color_name,
//          plan_types.pair_id
//   from plan_types
//   inner join color_classifications on
//       plan_types.color_classification_id = color_classifications.id
//   where plan_types.user_id = :userUid
//       or plan_types.pair_id = :pairId
//   order by plan_types.pair_id, plan_types.sort;
export async function findPlanTypeRows(
  scope: SessionScope
): Promise<PlanTypeRow[]> {
  return (
    db
      .select({
        id: planTypes.id,
        name: planTypes.name,
        sort: planTypes.sort,
        colorClassificationId: planTypes.colorClassificationId,
        colorName: colorClassifications.name,
        pairId: planTypes.pairId
      })
      .from(planTypes)
      .innerJoin(
        colorClassifications,
        eq(planTypes.colorClassificationId, colorClassifications.id)
      )
      .where(buildScopeWhere(planTypes, scope))
      // is_pair, sort 順で並べる。self（pairId=null）を先に、次に sort。
      .orderBy(asc(planTypes.pairId), asc(planTypes.sort))
  );
}

// scope 検証: 指定 plan_type が scope 内か。update / delete の対象確認に使う。
export async function findPlanTypeInScope(
  scope: SessionScope,
  id: Id
): Promise<{ id: Id; sort: number; pairId: Id | null } | null> {
  const [row] = await db
    .select({
      id: planTypes.id,
      sort: planTypes.sort,
      pairId: planTypes.pairId
    })
    .from(planTypes)
    .where(and(eq(planTypes.id, id), buildScopeWhere(planTypes, scope)))
    .limit(1);
  return row ?? null;
}

export async function insertPlanType(input: {
  name: string;
  colorClassificationId: Id;
  userId: string | null;
  pairId: Id | null;
}): Promise<void> {
  await db.insert(planTypes).values({
    name: input.name,
    colorClassificationId: input.colorClassificationId,
    userId: input.userId,
    pairId: input.pairId
  });
}

// UPDATE（名前・色のみ。所有列 user_id/pair_id は変えない）。
export async function updatePlanType(input: {
  id: Id;
  name: string;
  colorClassificationId: Id;
}): Promise<void> {
  await db
    .update(planTypes)
    .set({
      name: input.name,
      colorClassificationId: input.colorClassificationId
    })
    .where(eq(planTypes.id, input.id));
}

export async function deletePlanTypeById(id: Id): Promise<void> {
  await db.delete(planTypes).where(eq(planTypes.id, id));
}

// REORDER（任意順）。集まり（pairId）の検証は service 層で行う。
export async function findPlanTypeRowsForReorder(
  scope: SessionScope,
  ids: Id[]
): Promise<{ id: Id; sort: number; pairId: Id | null }[]> {
  return db
    .select({
      id: planTypes.id,
      sort: planTypes.sort,
      pairId: planTypes.pairId
    })
    .from(planTypes)
    .where(and(inArray(planTypes.id, ids), buildScopeWhere(planTypes, scope)));
}

export async function updatePlanTypeSorts(
  assignments: SortAssignment[]
): Promise<void> {
  await db.transaction(async (tx) => {
    for (const { id, sort } of assignments) {
      await tx.update(planTypes).set({ sort }).where(eq(planTypes.id, id));
    }
  });
}
