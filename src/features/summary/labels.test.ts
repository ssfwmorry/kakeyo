import { describe, expect, it } from 'vitest';
import {
  breakdownFootnote,
  settlementDiffText,
  settlementDoneTitle,
  settlementResultNoun,
  settlementResultVerb,
  settlementTransferText
} from './labels';

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

describe('settlement の文言', () => {
  it('差額の向きで「渡す」「受け取る」を切り替え、0 は差額なし', () => {
    expect(settlementDiffText(1200)).toBe('渡す 1,200');
    expect(settlementDiffText(-800)).toBe('受け取る 800');
    expect(settlementDiffText(0)).toBe('差額なし');
    expect(settlementResultVerb(1)).toBe('円を渡す');
    expect(settlementResultVerb(-1)).toBe('円を受け取る');
    expect(settlementResultVerb(0)).toBe('（差額なし）');
    expect(settlementResultNoun(1)).toBe('お渡し');
    expect(settlementResultNoun(-1)).toBe('受け取り');
  });

  it('立替の無い月は「済んでいる」と言わない', () => {
    expect(settlementDoneTitle(9, true)).toBe('9月の精算は済んでいます');
    expect(settlementDoneTitle(9, false)).toBe('9月の立替はありません');
  });

  it('精算 record の向きは負担する側から', () => {
    expect(settlementTransferText(true, 'ゆか')).toBe('自分 → ゆか');
    expect(settlementTransferText(false, 'ゆか')).toBe('ゆか → 自分');
  });
});
