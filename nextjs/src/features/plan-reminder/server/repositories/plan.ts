import 'server-only';
import { prisma } from '@/lib/server/db/client';
import { buildScopeWhere } from '@/lib/shared/db/scope';
import { startOfDayJst, toDateStringJst } from '@/lib/shared/domain/date';
import type { SessionScope } from '@/lib/shared/types/auth';
import type { Id } from '@/lib/shared/types/id';

// L5 plan リポジトリ。現行 RPC get_plan_list / upsertPlan / deletePlan を移植。
// 取得系は必ず buildScopeWhere を通す。日付（start_date/end_date）は date.ts 経由で
// 扱う（dayjs 直 import 禁止・方針書 §4）。DB は Date（@db.Date）で保持するため、
// 読み取りは YYYY-MM-DD 文字列へ、書き込みは JST 日付境界の Date へ変換する。

// 画面用の plan 行（plan_type 色・reminder 色を結合。get_plan_list 相当）。
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

// get_plan_list / 単一取得で共通の include（plan_type 色・reminder 色を結合）。
const planInclude = {
  planType: {
    select: {
      id: true,
      name: true,
      colorClassification: { select: { name: true } }
    }
  },
  reminder: {
    select: { colorClassification: { select: { name: true } } }
  }
} as const;

type PlanWithRelations = {
  id: Id;
  startDate: Date;
  endDate: Date;
  name: string;
  memo: string | null;
  reminderId: Id | null;
  pairId: Id | null;
  planType: {
    id: Id;
    name: string;
    colorClassification: { name: string };
  } | null;
  reminder: { colorClassification: { name: string } } | null;
};

function toPlanRow(row: PlanWithRelations): PlanRow {
  return {
    id: row.id,
    startDate: toDateStringJst(row.startDate),
    endDate: toDateStringJst(row.endDate),
    name: row.name,
    memo: row.memo,
    planTypeId: row.planType?.id ?? null,
    planTypeName: row.planType?.name ?? null,
    planTypeColorName: row.planType?.colorClassification.name ?? null,
    reminderColorName: row.reminder?.colorClassification.name ?? null,
    reminderId: row.reminderId,
    isPair: row.pairId !== null
  };
}

// READ。期間（start_date が [start, end] の範囲）で絞る（現行 get_plan_list 踏襲）。
export async function findPlanRows(
  scope: SessionScope,
  range: { start: string; end: string }
): Promise<PlanRow[]> {
  const rows = await prisma.plan.findMany({
    where: {
      AND: [
        buildScopeWhere(scope),
        {
          startDate: {
            gte: startOfDayJst(range.start),
            lte: startOfDayJst(range.end)
          }
        }
      ]
    },
    include: planInclude,
    orderBy: { startDate: 'asc' }
  });
  return rows.map(toPlanRow);
}

// READ（1 件）。plan 編集画面のプリフィル用。scope 外・不存在は null。
export async function findPlanForEdit(
  scope: SessionScope,
  id: Id
): Promise<PlanRow | null> {
  const row = await prisma.plan.findFirst({
    where: { AND: [{ id }, buildScopeWhere(scope)] },
    include: planInclude
  });
  return row ? toPlanRow(row) : null;
}

// scope 検証: 指定 plan が scope 内か。update / delete の対象確認に使う。
export async function findPlanInScope(
  scope: SessionScope,
  id: Id
): Promise<{ id: Id } | null> {
  return prisma.plan.findFirst({
    where: { AND: [{ id }, buildScopeWhere(scope)] },
    select: { id: true }
  });
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
  await prisma.plan.create({
    data: {
      name: input.name,
      startDate: startOfDayJst(input.startDate),
      endDate: startOfDayJst(input.endDate),
      planTypeId: input.planTypeId,
      memo: input.memo,
      userId: input.userId,
      pairId: input.pairId
    }
  });
}

// UPDATE（所有列 user_id/pair_id も現行同様に付け替える＝ペアモード切替に追従）。
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
  await prisma.plan.update({
    where: { id: input.id },
    data: {
      name: input.name,
      startDate: startOfDayJst(input.startDate),
      endDate: startOfDayJst(input.endDate),
      planTypeId: input.planTypeId,
      memo: input.memo,
      userId: input.userId,
      pairId: input.pairId
    }
  });
}

export async function deletePlanById(id: Id): Promise<void> {
  await prisma.plan.delete({ where: { id } });
}
