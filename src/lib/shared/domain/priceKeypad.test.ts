import { describe, expect, it } from 'vitest';
import { MAX_PRICE } from './price';
import { popDigit, pushDigit, pushDoubleZero } from './priceKeypad';

// テンキー押下ロジックの挙動を固定する。
// 上限は MAX_PRICE の「未満」（実質 9,999,999 円）。

describe('pushDigit', () => {
  it('先頭 0 は数字で上書きする', () => {
    expect(pushDigit(0, 5)).toBe(5);
    expect(pushDigit(0, 0)).toBe(0);
  });

  it('既存値に 1 桁足す（*10 + digit）', () => {
    expect(pushDigit(1, 2)).toBe(12);
    expect(pushDigit(12, 3)).toBe(123);
  });

  it('上限（MAX_PRICE 以上）になる push は無視して現状維持', () => {
    // 999,999 → 9,999,99? は 9,999,999 < 10,000,000 で許容。
    expect(pushDigit(999_999, 9)).toBe(9_999_999);
    // 9,999,999 にさらに 1 桁は 99,999,99? ≥ MAX で不可。
    expect(pushDigit(9_999_999, 0)).toBe(9_999_999);
    expect(pushDigit(1_000_000, 0)).toBe(1_000_000);
  });

  it('境界: 結果がちょうど MAX_PRICE になる push は不可（未満のみ）', () => {
    // 1,000,000 * 10 + 0 = 10,000,000 = MAX_PRICE → 不可。
    expect(pushDigit(1_000_000, 0)).toBe(1_000_000);
  });
});

describe('pushDoubleZero', () => {
  it('0 のときは 0 のまま', () => {
    expect(pushDoubleZero(0)).toBe(0);
  });

  it('*100 する', () => {
    expect(pushDoubleZero(1)).toBe(100);
    expect(pushDoubleZero(50)).toBe(5000);
  });

  it('上限を超える *100 は無視', () => {
    // 100,000 * 100 = 10,000,000 = MAX → 不可。
    expect(pushDoubleZero(100_000)).toBe(100_000);
    // 99,999 * 100 = 9,999,900 < MAX → 可。
    expect(pushDoubleZero(99_999)).toBe(9_999_900);
  });
});

describe('popDigit', () => {
  it('末尾 1 桁を削除する', () => {
    expect(popDigit(123)).toBe(12);
    expect(popDigit(5)).toBe(0);
    expect(popDigit(0)).toBe(0);
  });
});

it('MAX_PRICE は 1000 万（未満運用）', () => {
  expect(MAX_PRICE).toBe(10_000_000);
});
