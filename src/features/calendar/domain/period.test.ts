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

  it('サポート範囲（2000-01〜2099-12）を超えては移動しない', () => {
    // 下限 2000-01 でさらに戻しても頭打ち。
    expect(shiftMonth('2000-01', -1)).toBe('2000-01');
    expect(shiftMonth('2000-06', -12)).toBe('2000-01');
    // 上限 2099-12 でさらに進めても頭打ち。
    expect(shiftMonth('2099-12', 1)).toBe('2099-12');
    expect(shiftMonth('2099-06', 12)).toBe('2099-12');
  });
});

describe('monthLabel', () => {
  it('日本語の年月ラベル（先頭 0 を落とす）', () => {
    expect(monthLabel('2026-09')).toBe('2026年9月');
    expect(monthLabel('2026-12')).toBe('2026年12月');
  });
});
