import { describe, expect, it } from 'vitest';
import {
  bucketDiff,
  buildBalanceBuckets,
  latestBucketKey
} from './balance-buckets';
import type { TableRow } from './balance-table';

// 区間サンプリング（記録日 → 区間末日時点の値）の Vitest（純粋関数）。

// sum は buildBalanceTable が出す値をそのまま通すだけなので、期待値を読みやすいよう直接書く。
function row(
  createdDate: string,
  bankPrices: (number | null)[],
  sum: number | null
): TableRow {
  return { createdDate, bankPrices, sum };
}

const TODAY = '2026-09-25';

describe('buildBalanceBuckets', () => {
  it('1 年は今月を末尾に 12 か月、記録の無い月は直前の記録を引き継ぐ', () => {
    const buckets = buildBalanceBuckets(
      [row('2026-06-30', [100, 50], 150), row('2026-08-10', [120, 50], 170)],
      TODAY,
      '1y'
    );
    expect(buckets).toHaveLength(12);
    expect(buckets.map((bucket) => bucket.key)).toEqual([
      '2025-10',
      '2025-11',
      '2025-12',
      '2026-01',
      '2026-02',
      '2026-03',
      '2026-04',
      '2026-05',
      '2026-06',
      '2026-07',
      '2026-08',
      '2026-09'
    ]);
    expect(buckets[0].label).toBe('10月');
    // 7 月は記録が無いので 6/30 の値のまま。
    expect(buckets[9]).toMatchObject({
      key: '2026-07',
      asOfDate: '2026-06-30',
      prices: [100, 50],
      sum: 150
    });
    // 進行中の 9 月は最新の記録値。
    expect(buckets[11]).toMatchObject({
      key: '2026-09',
      asOfDate: '2026-08-10',
      sum: 170
    });
  });

  it('最初の記録より前の区間は空（棒を出さない）', () => {
    const buckets = buildBalanceBuckets(
      [row('2026-08-10', [1], 1)],
      TODAY,
      '1y'
    );
    expect(buckets[9]).toMatchObject({
      key: '2026-07',
      asOfDate: null,
      prices: [],
      sum: null
    });
    expect(buckets[10]).toMatchObject({ key: '2026-08', sum: 1 });
    expect(
      buckets.slice(0, 10).every((bucket) => bucket.asOfDate === null)
    ).toBe(true);
  });

  it('区間末日ちょうどの記録はその区間に入る', () => {
    const buckets = buildBalanceBuckets(
      [row('2026-08-31', [10], 10), row('2026-09-01', [20], 20)],
      TODAY,
      '1y'
    );
    expect(buckets[10]).toMatchObject({ key: '2026-08', sum: 10 });
    expect(buckets[11]).toMatchObject({ key: '2026-09', sum: 20 });
  });

  it('3 年は四半期 12 本で、年の最初の区間にだけ年を置く', () => {
    const buckets = buildBalanceBuckets([], TODAY, '3y');
    expect(buckets).toHaveLength(12);
    expect(buckets[0].key).toBe('2023-12');
    expect(buckets.at(-1)?.key).toBe('2026-09');
    expect(buckets.map((bucket) => bucket.label)).toEqual([
      '',
      '2024',
      '',
      '',
      '',
      '2025',
      '',
      '',
      '',
      '2026',
      '',
      ''
    ]);
  });

  it('5 年は半年 10 本', () => {
    const buckets = buildBalanceBuckets([], TODAY, '5y');
    expect(buckets).toHaveLength(10);
    expect(buckets[0]).toMatchObject({ key: '2022-06', label: '2022' });
    expect(buckets.at(-1)).toMatchObject({ key: '2026-12', label: '' });
  });

  it('期間の左端より前の記録も引き継がれ、全区間が同じ値になる', () => {
    const buckets = buildBalanceBuckets(
      [row('2023-01-15', [7], 7)],
      TODAY,
      '1y'
    );
    expect(buckets.every((bucket) => bucket.sum === 7)).toBe(true);
    expect(buckets[0].asOfDate).toBe('2023-01-15');
  });
});

describe('latestBucketKey', () => {
  it('値のある最新の区間を返し、無ければ null', () => {
    const buckets = buildBalanceBuckets(
      [row('2026-03-01', [1], 1)],
      TODAY,
      '1y'
    );
    expect(latestBucketKey(buckets)).toBe('2026-09');
    expect(latestBucketKey(buildBalanceBuckets([], TODAY, '1y'))).toBeNull();
  });
});

describe('bucketDiff', () => {
  const buckets = buildBalanceBuckets(
    [row('2026-07-05', [100], 100), row('2026-08-05', [130], 130)],
    TODAY,
    '1y'
  );
  const at = (key: string) => buckets.find((bucket) => bucket.key === key);

  it('1 つ前の区間との差を返す', () => {
    expect(bucketDiff(at('2026-08'), at('2026-07'))).toBe(30);
    // 9 月は 8 月の値を引き継ぐので差は 0。
    expect(bucketDiff(at('2026-09'), at('2026-08'))).toBe(0);
  });

  it('前の区間が空、または無ければ出せない', () => {
    expect(bucketDiff(at('2026-07'), at('2026-06'))).toBeNull();
    expect(bucketDiff(at('2025-10'), undefined)).toBeNull();
  });
});
