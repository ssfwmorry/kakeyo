import { describe, expect, it } from 'vitest';
import {
  toAxisTickStr,
  toShowPrefixStr,
  toShowStr,
  toShowStrWithIsPay
} from './format';

// 金額表示整形の Vitest。

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

describe('toAxisTickStr', () => {
  it('0 は万を付けずそのまま返す', () => {
    expect(toAxisTickStr(0)).toBe('0');
  });

  it('1 万未満は万に丸めず桁区切りで出す（0万 の連続を避ける）', () => {
    expect(toAxisTickStr(3000)).toBe('3,000');
    expect(toAxisTickStr(9999)).toBe('9,999');
  });

  it('万単位に丸めて「万」を付ける', () => {
    expect(toAxisTickStr(40000)).toBe('4万');
    expect(toAxisTickStr(120000)).toBe('12万');
  });

  it('端数は四捨五入する', () => {
    expect(toAxisTickStr(15000)).toBe('2万');
    expect(toAxisTickStr(14000)).toBe('1万');
  });

  it('万を超える桁は桁区切りを入れる', () => {
    expect(toAxisTickStr(12340000)).toBe('1,234万');
  });
});
