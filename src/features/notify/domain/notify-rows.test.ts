import { describe, expect, it } from 'vitest';
import type { ReminderItem } from '@/features/plan-reminder';
import {
  BaseType,
  ConditionType,
  ReminderType
} from '@/features/plan-reminder/domain/reminder-condition';
import { buildNotifyRows } from './notify-rows';

const TODAY = '2026-09-25';

function reminder(overrides: Partial<ReminderItem>): ReminderItem {
  return {
    id: 1,
    name: '電気代の支払い',
    reminderType: ReminderType.flow,
    date: '2026-09-20',
    memo: null,
    colorClassificationId: 1,
    colorName: 'orange',
    isPair: false,
    conditionId: 1,
    conditionType: ConditionType.month,
    month: 1,
    monthDay: null,
    baseType: BaseType.date,
    ...overrides
  };
}

describe('buildNotifyRows', () => {
  it('期日を過ぎたものだけを日付の昇順で並べる（当日は含めない）', () => {
    const rows = buildNotifyRows(
      [
        reminder({ id: 1, date: '2026-09-20' }),
        reminder({ id: 2, date: '2026-09-25' }),
        reminder({ id: 3, date: '2026-09-15' }),
        reminder({ id: 4, date: '2026-10-01' })
      ],
      TODAY
    );
    expect(rows.map((row) => row.id)).toEqual([3, 1]);
  });

  it('過ぎた日数と次回日付を計算する', () => {
    const [row] = buildNotifyRows(
      [reminder({ date: '2026-09-20', month: 1, baseType: BaseType.date })],
      TODAY
    );
    expect(row.overdueDays).toBe(5);
    expect(row.nextDate).toBe('2026-10-20');
  });

  it('「チェックした日から」は今日を基準にする', () => {
    const [row] = buildNotifyRows(
      [reminder({ date: '2026-09-20', month: 2, baseType: BaseType.now })],
      TODAY
    );
    expect(row.nextDate).toBe('2026-11-25');
  });

  it('毎年型は翌年の同じ月日', () => {
    const [row] = buildNotifyRows(
      [
        reminder({
          date: '2026-09-15',
          conditionType: ConditionType.monthDay,
          monthDay: '09-15',
          month: null,
          baseType: null
        })
      ],
      TODAY
    );
    expect(row.nextDate).toBe('2027-09-15');
  });

  it('予定に残すのは「予定に残す」型かつ「〜か月後」型のときだけ', () => {
    const rows = buildNotifyRows(
      [
        reminder({ id: 1, reminderType: ReminderType.stock }),
        reminder({ id: 2, reminderType: ReminderType.flow }),
        reminder({
          id: 3,
          reminderType: ReminderType.stock,
          conditionType: ConditionType.monthDay,
          monthDay: '09-20',
          month: null,
          baseType: null
        })
      ],
      TODAY
    );
    expect(rows.map((row) => row.keepsPlan)).toEqual([true, false, false]);
  });
});
