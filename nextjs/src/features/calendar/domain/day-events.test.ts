import { describe, expect, it } from 'vitest';
import type { PlanItem, ReminderItem } from '@/features/plan-reminder';
import { selectDayPlans, selectDayReminders } from './day-events';

function plan(id: number, startDate: string, endDate: string): PlanItem {
  return {
    id,
    startDate,
    endDate,
    name: `plan-${id}`,
    memo: null,
    planTypeId: 1,
    planTypeName: 'type',
    planTypeColorName: 'red',
    reminderColorName: null,
    reminderId: null,
    isPair: false
  };
}

function reminder(id: number, date: string): ReminderItem {
  return {
    id,
    name: `reminder-${id}`,
    reminderType: 1,
    date,
    memo: null,
    colorClassificationId: 1,
    colorName: 'blue',
    isPair: false,
    conditionId: 1,
    conditionType: 1,
    month: null,
    monthDay: null,
    baseType: null
  };
}

describe('selectDayPlans', () => {
  const plans = [
    plan(1, '2026-09-10', '2026-09-10'),
    plan(2, '2026-09-20', '2026-09-23'),
    plan(3, '2026-09-24', '2026-09-30')
  ];

  it('単日の予定はその日だけに載る', () => {
    expect(selectDayPlans(plans, '2026-09-10').map((p) => p.id)).toEqual([1]);
    expect(selectDayPlans(plans, '2026-09-11')).toEqual([]);
  });

  it('複数日の予定は開始日・終了日を含む期間中の日に載る', () => {
    expect(selectDayPlans(plans, '2026-09-20').map((p) => p.id)).toEqual([2]);
    expect(selectDayPlans(plans, '2026-09-22').map((p) => p.id)).toEqual([2]);
    expect(selectDayPlans(plans, '2026-09-23').map((p) => p.id)).toEqual([2]);
    expect(selectDayPlans(plans, '2026-09-24').map((p) => p.id)).toEqual([3]);
  });
});

describe('selectDayReminders', () => {
  it('日付が一致するリマインダーだけを返す', () => {
    const reminders = [reminder(1, '2026-09-25'), reminder(2, '2026-09-26')];
    expect(
      selectDayReminders(reminders, '2026-09-25').map((r) => r.id)
    ).toEqual([1]);
    expect(selectDayReminders(reminders, '2026-09-27')).toEqual([]);
  });
});
