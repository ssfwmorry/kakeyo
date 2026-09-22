import { describe, expect, it } from 'vitest';
import { monthLabel, shiftMonth, yearLabel } from './period';

// 月/年ナビ計算の Vitest（純粋関数）。

describe('shiftMonth', () => {
  it('月内の前後移動', () => {
    expect(shiftMonth('2026-06', -1)).toBe('2026-05');
    expect(shiftMonth('2026-06', 1)).toBe('2026-07');
  });
  it('年境界を跨ぐ', () => {
    expect(shiftMonth('2026-01', -1)).toBe('2025-12');
    expect(shiftMonth('2026-12', 1)).toBe('2027-01');
  });
  it('複数月の移動', () => {
    expect(shiftMonth('2026-03', -5)).toBe('2025-10');
    expect(shiftMonth('2026-11', 3)).toBe('2027-02');
  });
});

describe('labels', () => {
  it('月ラベルはゼロ落とし', () => {
    expect(monthLabel('2026-09')).toBe('2026年9月');
    expect(monthLabel('2026-12')).toBe('2026年12月');
  });
  it('年ラベル', () => {
    expect(yearLabel(2026)).toBe('2026年');
  });
});
