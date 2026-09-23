import { describe, expect, it } from 'vitest';
import type { DaySum } from '../types';
import { sumMonthFromDays } from './day-sum';

function day(dateStr: string, sum: number): DaySum {
  return { dateStr, sum, records: [], holidayName: null };
}

describe('sumMonthFromDays', () => {
  it('対象月の日別収支だけを足し上げる（前後月は除く）', () => {
    const days = [
      day('2026-08-31', 999),
      day('2026-09-01', 81200),
      day('2026-09-25', -250000),
      day('2026-10-01', 500)
    ];
    expect(sumMonthFromDays(days, '2026-09')).toBe(81200 - 250000);
  });

  it('対象月に記録が無ければ 0', () => {
    expect(sumMonthFromDays([day('2026-08-31', 100)], '2026-09')).toBe(0);
  });
});
