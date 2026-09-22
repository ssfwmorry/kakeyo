import { describe, expect, it } from 'vitest';
import {
  BaseType,
  ConditionType,
  calcNextReminderDate
} from './reminder-condition';

// 次回リマインド日の計算（純粋関数）の Vitest。現行 checkReminder の newDate 相当。

describe('calcNextReminderDate', () => {
  it('MONTH_DAY: 翌年の MM-DD を返す', () => {
    const result = calcNextReminderDate({
      conditionType: ConditionType.monthDay,
      month: null,
      monthDay: '03-15',
      baseType: null,
      currentDate: '2026-01-01',
      today: '2026-09-22'
    });
    expect(result).toBe('2027-03-15');
  });

  it('MONTH + NOW: 今日から N ヶ月後', () => {
    const result = calcNextReminderDate({
      conditionType: ConditionType.month,
      month: 3,
      monthDay: null,
      baseType: BaseType.now,
      currentDate: '2026-01-01',
      today: '2026-09-22'
    });
    expect(result).toBe('2026-12-22');
  });

  it('MONTH + DATE: reminder.date から N ヶ月後', () => {
    const result = calcNextReminderDate({
      conditionType: ConditionType.month,
      month: 2,
      monthDay: null,
      baseType: BaseType.date,
      currentDate: '2026-01-31',
      today: '2026-09-22'
    });
    // 1/31 の 2 ヶ月後 = 3/31（月末 clamp は不要）
    expect(result).toBe('2026-03-31');
  });

  it('MONTH + DATE: 月末を超える日は月末に clamp（1/31 + 1 ヶ月 = 2/28）', () => {
    const result = calcNextReminderDate({
      conditionType: ConditionType.month,
      month: 1,
      monthDay: null,
      baseType: BaseType.date,
      currentDate: '2026-01-31',
      today: '2026-09-22'
    });
    expect(result).toBe('2026-02-28');
  });

  it('MONTH: 年跨ぎ（11 月 + 3 ヶ月 = 翌年 2 月）', () => {
    const result = calcNextReminderDate({
      conditionType: ConditionType.month,
      month: 3,
      monthDay: null,
      baseType: BaseType.date,
      currentDate: '2026-11-10',
      today: '2026-09-22'
    });
    expect(result).toBe('2027-02-10');
  });

  it('必須項目欠落は null', () => {
    expect(
      calcNextReminderDate({
        conditionType: ConditionType.monthDay,
        month: null,
        monthDay: null,
        baseType: null,
        currentDate: '2026-01-01',
        today: '2026-09-22'
      })
    ).toBeNull();
    expect(
      calcNextReminderDate({
        conditionType: ConditionType.month,
        month: null,
        monthDay: null,
        baseType: BaseType.now,
        currentDate: '2026-01-01',
        today: '2026-09-22'
      })
    ).toBeNull();
  });
});
