import { describe, expect, it } from 'vitest';
import { pickLastUsedMethodId } from './last-used-method';

const lastUsed = {
  paySelf: 1,
  incomeSelf: 2,
  payPairInstead: 3,
  payPairShared: 4,
  incomePair: 5
};

describe('pickLastUsedMethodId', () => {
  it('個人は収支だけで決まる（立替は無視する）', () => {
    expect(
      pickLastUsedMethodId(lastUsed, {
        isPay: true,
        isPair: false,
        isInstead: true
      })
    ).toBe(1);
    expect(
      pickLastUsedMethodId(lastUsed, {
        isPay: false,
        isPair: false,
        isInstead: false
      })
    ).toBe(2);
  });

  it('共有の支出は立替と共有のお金で分かれる', () => {
    expect(
      pickLastUsedMethodId(lastUsed, {
        isPay: true,
        isPair: true,
        isInstead: true
      })
    ).toBe(3);
    expect(
      pickLastUsedMethodId(lastUsed, {
        isPay: true,
        isPair: true,
        isInstead: false
      })
    ).toBe(4);
  });

  it('共有の収入は立替に依らない', () => {
    expect(
      pickLastUsedMethodId(lastUsed, {
        isPay: false,
        isPair: true,
        isInstead: true
      })
    ).toBe(5);
  });

  it('記録が無い組み合わせは null', () => {
    expect(
      pickLastUsedMethodId(
        { ...lastUsed, paySelf: null },
        { isPay: true, isPair: false, isInstead: false }
      )
    ).toBeNull();
  });
});
