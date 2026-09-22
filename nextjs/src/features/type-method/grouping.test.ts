import { describe, expect, it } from 'vitest';
import type { ColorClassification } from '@/features/master';
import { groupMethodList } from './grouping';
import type { MethodRow } from './server/repositories/method';

// method グルーピングの純粋関数テスト。特に「精算（both）は pair 専用で self は常に空」
// という GroupedMethodList の契約（旧 getMethodList の both.self: [] 固定）を保護する。

const COLORS: ColorClassification[] = [
  { id: 1, name: 'red' },
  { id: 2, name: 'blue' }
];

function methodRow(overrides: Partial<MethodRow>): MethodRow {
  return {
    id: 1,
    name: 'method',
    isPay: true,
    sort: 0,
    colorClassificationId: 1,
    pairId: null,
    ...overrides
  };
}

describe('groupMethodList', () => {
  it('isPay=true/false を pay/income × self(pairId=null)/pair(pairId!=null) に振り分ける', () => {
    const result = groupMethodList(
      [
        methodRow({ id: 1, isPay: true, pairId: null }),
        methodRow({ id: 2, isPay: true, pairId: 10 }),
        methodRow({ id: 3, isPay: false, pairId: null }),
        methodRow({ id: 4, isPay: false, pairId: 10 })
      ],
      COLORS
    );
    expect(result.pay.self.map((c) => c.id)).toEqual([1]);
    expect(result.pay.pair.map((c) => c.id)).toEqual([2]);
    expect(result.income.self.map((c) => c.id)).toEqual([3]);
    expect(result.income.pair.map((c) => c.id)).toEqual([4]);
  });

  it('精算（isPay=null）は both.pair に入る（pairId 付き）', () => {
    const result = groupMethodList(
      [methodRow({ id: 5, isPay: null, pairId: 10 })],
      COLORS
    );
    expect(result.both.pair.map((c) => c.id)).toEqual([5]);
    expect(result.both.self).toEqual([]);
  });

  it('個人所有（isPair=false）の精算 method でも both.self には入れず both.pair に寄せる', () => {
    // 旧データ由来の異常データ（user_id 付きの精算 method）を想定。
    // 契約「both.self は常に空」を実装で保証する。
    const result = groupMethodList(
      [methodRow({ id: 6, isPay: null, pairId: null })],
      COLORS
    );
    expect(result.both.self).toEqual([]);
    expect(result.both.pair.map((c) => c.id)).toEqual([6]);
  });

  it('色 id → 色名を解決する', () => {
    const result = groupMethodList(
      [
        methodRow({
          id: 1,
          isPay: true,
          pairId: null,
          colorClassificationId: 2
        })
      ],
      COLORS
    );
    expect(result.pay.self[0]?.colorName).toBe('blue');
  });
});
