import { describe, expect, it } from 'vitest';
import { monthLabel, shiftMonth } from './period';

describe('shiftMonth', () => {
  it('前後の月へ移動する', () => {
    expect(shiftMonth('2026-09', 1)).toBe('2026-10');
    expect(shiftMonth('2026-09', -1)).toBe('2026-08');
  });

  it('年境界をまたぐ', () => {
    expect(shiftMonth('2026-12', 1)).toBe('2027-01');
    expect(shiftMonth('2026-01', -1)).toBe('2025-12');
  });

  it('複数月の移動', () => {
    expect(shiftMonth('2026-09', 5)).toBe('2027-02');
    expect(shiftMonth('2026-03', -5)).toBe('2025-10');
  });
});

describe('monthLabel', () => {
  it('日本語の年月ラベル（先頭 0 を落とす）', () => {
    expect(monthLabel('2026-09')).toBe('2026年9月');
    expect(monthLabel('2026-12')).toBe('2026年12月');
  });
});
