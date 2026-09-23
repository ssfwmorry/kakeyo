import { describe, expect, it } from 'vitest';
import { toAxisMonthLabel, toManUnit, toTooltipDateLabel } from './format';

// bank の表示整形（純粋関数）の Vitest。
// 軸ラベルは「日を落として年月へ畳む」、ツールチップは「日まで残す」で対になる。

describe('toManUnit', () => {
  it('(a) 円を万単位・小数第一位に丸める', () => {
    expect(toManUnit(1_200_000)).toBe(120);
    expect(toManUnit(1_234_000)).toBe(123.4);
  });
});

describe('toAxisMonthLabel', () => {
  it('(a) YYYY-MM-DD を YYYY/MM へ畳む', () => {
    expect(toAxisMonthLabel('2026-02-28')).toBe('2026/02');
  });

  it('(b) 想定外の形式はそのまま返す（軸を空にしない）', () => {
    expect(toAxisMonthLabel('2026')).toBe('2026');
    expect(toAxisMonthLabel('')).toBe('');
  });
});

describe('toTooltipDateLabel', () => {
  it('(a) 日まで残したまま区切りを / にする', () => {
    expect(toTooltipDateLabel('2026-02-28')).toBe('2026/02/28');
  });
});
