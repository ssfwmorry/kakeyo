import { describe, expect, it } from 'vitest';
import type { ReminderItem } from '@/features/plan-reminder';
import { buildNotifyRows } from './notify-rows';

const TODAY = '2026-09-25';

function reminder(overrides: Partial<ReminderItem>): ReminderItem {
  return {
    id: 1,
    name: '電気代の支払い',
    date: '2026-09-20',
    memo: null,
    colorClassificationId: 1,
    colorName: 'orange',
    isPair: false,
    rule: { kind: 'month', interval: 1, day: 20 },
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
      [
        reminder({
          date: '2026-09-20',
          rule: { kind: 'month', interval: 1, day: 20 }
        })
      ],
      TODAY
    );
    expect(row.overdueDays).toBe(5);
    expect(row.nextDate).toBe('2026-10-20');
  });

  it('先送り（afterCheck）は今日を基準にする', () => {
    const [row] = buildNotifyRows(
      [
        reminder({
          date: '2026-09-20',
          rule: { kind: 'afterCheck', months: 2 }
        })
      ],
      TODAY
    );
    expect(row.nextDate).toBe('2026-11-25');
  });

  it('毎年型は翌年の同じ月日', () => {
    const [row] = buildNotifyRows(
      [
        reminder({
          date: '2026-09-15',
          rule: { kind: 'year', month: 9, day: 15 }
        })
      ],
      TODAY
    );
    expect(row.nextDate).toBe('2027-09-15');
  });

  it('rule が壊れていれば nextDate は null（行自体は出す）', () => {
    const [row] = buildNotifyRows(
      [reminder({ date: '2026-09-20', rule: null })],
      TODAY
    );
    expect(row.overdueDays).toBe(5);
    expect(row.nextDate).toBeNull();
  });
});
