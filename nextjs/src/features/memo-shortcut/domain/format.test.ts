import { describe, expect, it } from 'vitest';
import { formatShortcutAmount } from './format';

describe('formatShortcutAmount', () => {
  it('支出は - 符号と 3 桁区切りで整形する', () => {
    expect(formatShortcutAmount(1500, true)).toBe('-¥1,500');
  });

  it('収入は + 符号で整形する', () => {
    expect(formatShortcutAmount(1200, false)).toBe('+¥1,200');
  });

  it('0 円も符号付きで整形する', () => {
    expect(formatShortcutAmount(0, true)).toBe('-¥0');
  });

  it('100 万円（上限）を 3 桁区切りで整形する', () => {
    expect(formatShortcutAmount(1000000, true)).toBe('-¥1,000,000');
  });
});
