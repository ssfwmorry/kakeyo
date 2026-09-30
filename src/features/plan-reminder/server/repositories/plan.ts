import 'server-only';
import { and, asc, between, eq } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { db } from '@/lib/server/db/client';
import {
  colorClassifications,
  plans,
  planTypes,
  reminders
} from '@/lib/server/db/schema';
import { buildScopeWhere } from '@/lib/shared/db/scope';
import { dateOnlyValueJst, toDateStringJst } from '@/lib/shared/domain/date';
import type { SessionScope } from '@/lib/shared/types/auth';
import type { Id } from '@/lib/shared/types/id';

// plan リポジトリ（一覧取得 / upsert / 削除）。
// 取得系は必ず buildScopeWhere を通す。日付（start_date/end_date）は date.ts 経由で
// 扱う。DB は date 型のため、書き込みは UTC 基準の『その日付』へ変換し、
// 読み取りは YYYY-MM-DD 文字列へ戻す。

// 画面用の plan 行（plan_type 色・reminder 色を結合）。
export type PlanRow = {
  id: Id;
  startDate: string;
  endDate: string;
  name: string;
  memo: string | null;
  planTypeId: Id | null;
  planTypeName: string | null;
  planTypeColorName: string | null;
  reminderColorName: string | null;
  reminderId: Id | null;
  isPair: boolean;
};

// 一覧取得 / 単一取得で共通の select（plan_type 色・reminder 色を結合）。
// reminder の色は plan_type とは別の color 行を引くため、color_classifications を
// 2 回別名で join する。
const planTypeColor = alias(colorClassifications, 'plan_type_color');
const reminderColor = alias(colorClassifications, 'reminder_color');

const planColumns = {
  id: plans.id,
  startDate: plans.startDate,
  endDate: plans.endDate,
  name: plans.name,
  memo: plans.memo,
  reminderId: plans.reminderId,
  pairId: plans.pairId,
  planTypeId: planTypes.id,
  planTypeName: planTypes.name,
  planTypeColorName: planTypeColor.name,
  reminderColorName: reminderColor.name
} as const;

// planColumns を select した 1 行。
type PlanSelectedRow = {
  id: Id;
  startDate: Date;
  endDate: Date;
  name: string;
  memo: string | null;
  reminderId: Id | null;
  pairId: Id | null;
  planTypeId: Id | null;
  planTypeName: string | null;
  planTypeColorName: string | null;
  reminderColorName: string | null;
};

// plan に plan_type / reminder（どちらも任意）を左結合する共通の from 句。
function selectPlans() {
  return db
    .select(planColumns)
    .from(plans)
    .leftJoin(planTypes, eq(plans.planTypeId, planTypes.id))
    .leftJoin(
      planTypeColor,
      eq(planTypes.colorClassificationId, planTypeColor.id)
    )
    .leftJoin(reminders, eq(plans.reminderId, reminders.id))
    .leftJoin(
      reminderColor,
      eq(reminders.colorClassificationId, reminderColor.id)
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
    reminderColorName: row.reminderColorName,
    reminderId: row.reminderId,
    isPair: row.pairId !== null
  };
}

// READ。期間（start_date が [start, end] の範囲）で絞る。
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
  planTypeId: Id | null;
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
  planTypeId: Id | null;
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
