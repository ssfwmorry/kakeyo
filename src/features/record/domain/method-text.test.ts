import { describe, expect, it } from 'vitest';
import { methodLineText } from './method-text';

describe('methodLineText', () => {
  const base = {
    isSelf: true,
    isInstead: null,
    methodName: 'クレジット',
    pairUserName: null
  };

  it('個人・共有の記録は方法名そのまま', () => {
    expect(methodLineText(base)).toBe('クレジット');
    expect(methodLineText({ ...base, isSelf: false, isInstead: false })).toBe(
      'クレジット'
    );
  });

  it('自分の立替は方法名に（立替）を添える', () => {
    expect(
      methodLineText({ ...base, isInstead: true, pairUserName: 'たろう' })
    ).toBe('クレジット（立替）');
  });

  it('相手の立替は方法名を出さず「〜の立替」にする', () => {
    expect(
      methodLineText({
        ...base,
        isSelf: false,
        isInstead: true,
        pairUserName: 'はなこ'
      })
    ).toBe('はなこの立替');
  });
});
