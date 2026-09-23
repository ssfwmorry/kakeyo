import { describe, expect, it } from 'vitest';
import { dayOptionsForMonth, daysInMonthFixed } from './month-days';

// 月ごとの日数（うるう年非考慮＝2 月は 28 固定）の検証。

describe('daysInMonthFixed', () => {
  it('大の月は 31 日', () => {
    for (const m of [1, 3, 5, 7, 8, 10, 12]) {
      expect(daysInMonthFixed(m)).toBe(31);
    }
  });

  it('小の月は 30 日', () => {
    for (const m of [4, 6, 9, 11]) {
      expect(daysInMonthFixed(m)).toBe(30);
    }
  });

  it('2 月は常に 28 日（うるう年非考慮）', () => {
    expect(daysInMonthFixed(2)).toBe(28);
  });

  it('範囲外の月は 31 にフォールバックする', () => {
    expect(daysInMonthFixed(0)).toBe(31);
    expect(daysInMonthFixed(13)).toBe(31);
  });
});

describe('dayOptionsForMonth', () => {
  it('4 月は 1〜30（31 を含まない）', () => {
    const days = dayOptionsForMonth(4);
    expect(days[0]).toBe(1);
    expect(days.at(-1)).toBe(30);
    expect(days).not.toContain(31);
  });

  it('2 月は 1〜28（29/30/31 を含まない）', () => {
    const days = dayOptionsForMonth(2);
    expect(days.at(-1)).toBe(28);
    expect(days).not.toContain(29);
  });

  it('1 月は 1〜31', () => {
    expect(dayOptionsForMonth(1).at(-1)).toBe(31);
  });
});
