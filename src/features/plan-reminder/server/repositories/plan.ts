import 'server-only';
import { and, asc, between, eq } from 'drizzle-orm';
import { db } from '@/lib/server/db/client';
import { colorClassifications, plans, planTypes } from '@/lib/server/db/schema';
import { buildScopeWhere } from '@/lib/shared/db/scope';
import { dateOnlyValueJst, toDateStringJst } from '@/lib/shared/domain/date';
import type { SessionScope } from '@/lib/shared/types/auth';
import type { Id } from '@/lib/shared/types/id';
import type { PlanItem } from '../../types';

// plan リポジトリ（一覧取得 / upsert / 削除）。
// 取得系は必ず buildScopeWhere を通す。日付（start_date/end_date）は date.ts 経由で
// 扱う。DB は date 型のため、書き込みは UTC 基準の『その日付』へ変換し、
// 読み取りは YYYY-MM-DD 文字列へ戻す。

// 画面用の plan 行（plan_type 色を結合）。日付・色名をここで整形し終えるので、
// 公開型 PlanItem と同じ形になる。
export type PlanRow = PlanItem;

// 一覧取得 / 単一取得で共通の select（plan_type 色を結合）。
const planColumns = {
  id: plans.id,
  startDate: plans.startDate,
  endDate: plans.endDate,
  name: plans.name,
  memo: plans.memo,
  pairId: plans.pairId,
  planTypeId: planTypes.id,
  planTypeName: planTypes.name,
  planTypeColorName: colorClassifications.name
} as const;

// planColumns を select した 1 行。
type PlanSelectedRow = {
  id: Id;
  startDate: Date;
  endDate: Date;
  name: string;
  memo: string | null;
  pairId: Id | null;
  planTypeId: Id;
  planTypeName: string;
  planTypeColorName: string;
};

// plan に plan_type を内部結合する共通の from 句（plan_type_id は NOT NULL）。
function selectPlans() {
  return db
    .select(planColumns)
    .from(plans)
    .innerJoin(planTypes, eq(plans.planTypeId, planTypes.id))
    .innerJoin(
      colorClassifications,
      eq(planTypes.colorClassificationId, colorClassifications.id)
    );
}

function toPlanRow(row: PlanSelectedRow): PlanRow {
  return {
    id: row.id,
    startDate: toDateStringJst(row.startDate),
    endDate: toDateStringJst(row.endDate),
    name: row.name,
    memo: row.memo,
    planTypeId: row.planTypeId,
    planTypeName: row.planTypeName,
    planTypeColorName: row.planTypeColorName,
    isPair: row.pairId !== null
  };
}

// READ。組み立てられる SQL:
//
//   select plans.id, plans.start_date, plans.end_date, plans.name, plans.memo,
//          plans.pair_id,
//          plan_types.id, plan_types.name,
//          color_classifications.name
//   from plans
//   inner join plan_types on plans.plan_type_id = plan_types.id
//   inner join color_classifications on
//       plan_types.color_classification_id = color_classifications.id
//   where (plans.user_id = :userUid or plans.pair_id = :pairId)
//       and plans.start_date between :start and :end
//   order by plans.start_date;
export async function findPlanRows(
  scope: SessionScope,
  range: { start: string; end: string }
): Promise<PlanRow[]> {
  const rows = await selectPlans()
    .where(
      and(
        buildScopeWhere(plans, scope),
        between(
          plans.startDate,
          dateOnlyValueJst(range.start),
          dateOnlyValueJst(range.end)
        )
      )
    )
    .orderBy(asc(plans.startDate));
  return rows.map(toPlanRow);
}

// READ（1 件）。plan 編集画面のプリフィル用。scope 外・不存在は null。
export async function findPlanForEdit(
  scope: SessionScope,
  id: Id
): Promise<PlanRow | null> {
  const [row] = await selectPlans()
    .where(and(eq(plans.id, id), buildScopeWhere(plans, scope)))
    .limit(1);
  return row ? toPlanRow(row) : null;
}

// scope 検証: 指定 plan が scope 内か。update / delete の対象確認に使う。
export async function findPlanInScope(
  scope: SessionScope,
  id: Id
): Promise<{ id: Id } | null> {
  const [row] = await db
    .select({ id: plans.id })
    .from(plans)
    .where(and(eq(plans.id, id), buildScopeWhere(plans, scope)))
    .limit(1);
  return row ?? null;
}

export async function insertPlan(input: {
  name: string;
  startDate: string;
  endDate: string;
  planTypeId: Id;
  memo: string | null;
  userId: string | null;
  pairId: Id | null;
}): Promise<void> {
  await db.insert(plans).values({
    name: input.name,
    startDate: dateOnlyValueJst(input.startDate),
    endDate: dateOnlyValueJst(input.endDate),
    planTypeId: input.planTypeId,
    memo: input.memo,
    userId: input.userId,
    pairId: input.pairId
  });
}

// UPDATE（所有列 user_id/pair_id も付け替える＝ペアモード切替に追従）。
export async function updatePlan(input: {
  id: Id;
  name: string;
  startDate: string;
  endDate: string;
  planTypeId: Id;
  memo: string | null;
  userId: string | null;
  pairId: Id | null;
}): Promise<void> {
  await db
    .update(plans)
    .set({
      name: input.name,
      startDate: dateOnlyValueJst(input.startDate),
      endDate: dateOnlyValueJst(input.endDate),
      planTypeId: input.planTypeId,
      memo: input.memo,
      userId: input.userId,
      pairId: input.pairId
    })
    .where(eq(plans.id, input.id));
}

export async function deletePlanById(id: Id): Promise<void> {
  await db.delete(plans).where(eq(plans.id, id));
}
