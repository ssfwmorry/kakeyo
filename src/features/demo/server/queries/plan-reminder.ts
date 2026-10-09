import 'server-only';
import {
  groupPlanTypeList,
  groupReminderList
} from '@/features/plan-reminder/grouping';
import type { PlanRow } from '@/features/plan-reminder/server/repositories/plan';
import type { PlanTypeRow } from '@/features/plan-reminder/server/repositories/plan-type';
import type { ReminderRow } from '@/features/plan-reminder/server/repositories/reminder';
import type {
  GroupedPlanTypeList,
  GroupedReminderList,
  PlanItem
} from '@/features/plan-reminder/types';
import type { SessionScope } from '@/lib/shared/types/auth';
import { colorName } from '../dataset/colors';
import { findPlanType, planTypeRows } from '../dataset/plan-types';
import { type DemoPlan, planRows } from '../dataset/plans';
import { type DemoReminder, reminderRows } from '../dataset/reminders';
import { visibleTo } from '../dataset/scope';

// plan-reminder のデモ射影。dataset を実リポジトリと同じ行型（PlanTypeRow / PlanRow /
// ReminderRow）に写し、画面用の整形は実処理と同じ grouping.ts に任せる。

function toPlanTypeRow(row: (typeof planTypeRows)[number]): PlanTypeRow {
  return {
    id: row.id,
    name: row.name,
    sort: row.sort,
    colorClassificationId: row.colorId,
    colorName: colorName(row.colorId),
    pairId: row.pairId
  };
}

// findPlanTypeRows 相当: self（pairId=null）を先に、次に sort。
export function getPlanTypeCardList(scope: SessionScope): GroupedPlanTypeList {
  const rows = visibleTo(scope, planTypeRows)
    .sort(
      (a, b) =>
        Number(a.pairId !== null) - Number(b.pairId !== null) || a.sort - b.sort
    )
    .map(toPlanTypeRow);
  return groupPlanTypeList(rows);
}

// planInclude 相当（plan_type の名前・色を join）。
function toPlanRow(row: DemoPlan): PlanRow {
  const planType = findPlanType(row.planTypeId);
  return {
    id: row.id,
    startDate: row.startDate,
    endDate: row.endDate,
    name: row.name,
    memo: row.memo,
    planTypeId: planType.id,
    planTypeName: planType.name,
    planTypeColorName: colorName(planType.colorId),
    isPair: row.pairId !== null
  };
}

// findPlanRows 相当: start_date が [start, end] の予定を開始日昇順で返す。
export function getPlanList(
  scope: SessionScope,
  range: { start: string; end: string }
): PlanItem[] {
  const rows = visibleTo(scope, planRows)
    .filter((row) => row.startDate >= range.start && row.startDate <= range.end)
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
    .map(toPlanRow);
  return rows;
}

// findPlanForEdit 相当: scope 内の plan 1 件（見つからなければ null = 新規扱い）。
export function getPlanForEdit(
  scope: SessionScope,
  id: number
): PlanItem | null {
  const row = visibleTo(scope, planRows).find((r) => r.id === id);
  return row ? toPlanRow(row) : null;
}

function toReminderRow(row: DemoReminder): ReminderRow {
  return {
    id: row.id,
    name: row.name,
    date: row.date,
    memo: row.memo,
    colorClassificationId: row.colorId,
    colorName: colorName(row.colorId),
    pairId: row.pairId,
    rule: row.rule
  };
}

// findReminderRows 相当: color_classification_id 昇順。
export function getReminderList(scope: SessionScope): GroupedReminderList {
  const rows = visibleTo(scope, reminderRows)
    .sort((a, b) => a.colorId - b.colorId)
    .map(toReminderRow);
  return groupReminderList(rows);
}

// findReminderInScope 相当: scope 内の reminder 1 件（不存在は null）。
export function findReminderInScope(
  scope: SessionScope,
  id: number
): ReminderRow | null {
  const row = visibleTo(scope, reminderRows).find((r) => r.id === id);
  return row ? toReminderRow(row) : null;
}
