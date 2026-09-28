import { describe, expect, it } from 'vitest';
import { assignSorts, planReorder } from './reorder';

describe('assignSorts', () => {
  it('既存の sort を昇順にして新しい順へ割り当てる', () => {
    expect(assignSorts([30, 10, 20], [3, 1, 2])).toEqual([
      { id: 3, sort: 10 },
      { id: 1, sort: 20 },
      { id: 2, sort: 30 }
    ]);
  });

  it('sort の値の集合は変わらない（発番しない）', () => {
    const result = assignSorts([5, 100, 7], [2, 3, 1]);
    expect(result.map((entry) => entry.sort).sort((a, b) => a - b)).toEqual([
      5, 7, 100
    ]);
  });

  it('数が合わなければ例外', () => {
    expect(() => assignSorts([1, 2], [1])).toThrow();
  });
});

describe('planReorder', () => {
  const rows = [
    { id: 1, sort: 10, bucket: 'a' },
    { id: 2, sort: 20, bucket: 'a' },
    { id: 3, sort: 30, bucket: 'a' }
  ];
  const bucketOf = (row: { bucket: string }) => row.bucket;

  it('同じ集まりの行なら割り当てを返す', () => {
    expect(planReorder(rows, [2, 3, 1], bucketOf)).toEqual([
      { id: 2, sort: 10 },
      { id: 3, sort: 20 },
      { id: 1, sort: 30 }
    ]);
  });

  it('scope 外（行が見つからない id）が混ざると null', () => {
    expect(planReorder(rows.slice(0, 2), [1, 2, 9], bucketOf)).toBeNull();
  });

  it('id が重複すると null', () => {
    expect(planReorder(rows, [1, 1, 2], bucketOf)).toBeNull();
  });

  it('集まりが混ざると null', () => {
    const mixed = [...rows.slice(0, 2), { id: 3, sort: 30, bucket: 'b' }];
    expect(planReorder(mixed, [3, 2, 1], bucketOf)).toBeNull();
  });
});
