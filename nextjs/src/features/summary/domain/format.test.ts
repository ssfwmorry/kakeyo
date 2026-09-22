import { describe, expect, it } from 'vitest';
import { toShowPrefixStr, toShowStr, toShowStrWithIsPay } from './format';

// 金額表示整形の Vitest（旧 StringUtility 相当）。

describe('toShowStr', () => {
  it('正/0 はそのまま桁区切り、負は先頭 + で絶対値', () => {
    expect(toShowStr(0)).toBe('0');
    expect(toShowStr(1234)).toBe('1,234');
    expect(toShowStr(-1234)).toBe('+1,234');
  });
});

describe('toShowPrefixStr', () => {
  it('0→"0"、正→先頭 -、負→先頭 +', () => {
    expect(toShowPrefixStr(0)).toBe('0');
    expect(toShowPrefixStr(1000)).toBe('-1,000');
    expect(toShowPrefixStr(-1000)).toBe('+1,000');
  });
});

describe('toShowStrWithIsPay', () => {
  it('0→"0"、支払はそのまま、受取は先頭 +', () => {
    expect(toShowStrWithIsPay(0, true)).toBe('0');
    expect(toShowStrWithIsPay(5000, true)).toBe('5,000');
    expect(toShowStrWithIsPay(5000, false)).toBe('+5,000');
  });
});
