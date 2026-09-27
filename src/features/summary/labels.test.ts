import { describe, expect, it } from 'vitest';
import { breakdownFootnote } from './labels';

describe('breakdownFootnote', () => {
  it('ペア未設定なら立替の説明を出さない', () => {
    expect(breakdownFootnote(false, false, true, '支出')).toBeNull();
    expect(breakdownFootnote(false, false, false, '支出')).toBeNull();
  });

  it('共有モードは立替を区別しないことを伝える', () => {
    expect(breakdownFootnote(true, true, true, '支出')).toContain(
      '立替かどうかは区別せず'
    );
  });

  it('個人モードは立替の扱いと呼び名を反映する', () => {
    expect(breakdownFootnote(true, false, true, '支払')).toBe(
      '立替込み：相手の分の立替と精算を含めた、相手を考慮した自分の支払です。'
    );
    expect(breakdownFootnote(true, false, false, '収入')).toBe(
      '自分のみ：立替と精算を含めない、自分個人の収入です。'
    );
  });
});
