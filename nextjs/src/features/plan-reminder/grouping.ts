import { planColorHex } from './color';
import type { PlanRow } from './server/repositories/plan';
import type { PlanTypeRow } from './server/repositories/plan-type';
import type { ReminderRow } from './server/repositories/reminder';
import type {
  GroupedPlanTypeList,
  GroupedReminderList,
  PlanItem,
  PlanTypeCard,
  ReminderItem
} from './types';

// 取得系リポジトリの行データを画面用の FE 型に整形する純粋関数群
// （server-only を含まず Client / Vitest からも import 可能）。
// 色名 → hex や self/pair 振り分けなど「表示のための整形」をここに集約する。

// planColorHex は inline style 用の hex だが、カードは colorName（色分類名）を持てば
// 十分なため、ここでは行→カードの写像と self/pair 振り分けのみを行う。
export function groupPlanTypeList(rows: PlanTypeRow[]): GroupedPlanTypeList {
  const cards: PlanTypeCard[] = rows.map((row) => ({
    id: row.id,
    name: row.name,
    colorClassificationId: row.colorClassificationId,
    colorName: row.colorName,
    isPair: row.pairId !== null
  }));
  return {
    self: cards.filter((card) => !card.isPair),
    pair: cards.filter((card) => card.isPair)
  };
}

// plan 行 → 画面用 PlanItem（日付・色名はリポジトリで整形済み）。
export function toPlanItems(rows: PlanRow[]): PlanItem[] {
  return rows.map((row) => ({
    id: row.id,
    startDate: row.startDate,
    endDate: row.endDate,
    name: row.name,
    memo: row.memo,
    planTypeId: row.planTypeId,
    planTypeName: row.planTypeName,
    planTypeColorName: row.planTypeColorName,
    reminderColorName: row.reminderColorName,
    reminderId: row.reminderId,
    isPair: row.isPair
  }));
}

// reminder 行 → self/pair/all 振り分け（現行 getReminderList 踏襲）。
export function groupReminderList(rows: ReminderRow[]): GroupedReminderList {
  const items: ReminderItem[] = rows.map((row) => ({
    id: row.id,
    name: row.name,
    reminderType: row.reminderType,
    date: row.date,
    memo: row.memo,
    colorClassificationId: row.colorClassificationId,
    colorName: row.colorName,
    isPair: row.pairId !== null,
    conditionId: row.conditionId,
    conditionType: row.conditionType,
    month: row.month,
    monthDay: row.monthDay,
    baseType: row.baseType
  }));
  return {
    self: items.filter((item) => !item.isPair),
    pair: items.filter((item) => item.isPair),
    all: items
  };
}

// 未知色フォールバック込みの hex 変換を再エクスポート（UI が color.ts を直接持たず済む）。
export { planColorHex };
