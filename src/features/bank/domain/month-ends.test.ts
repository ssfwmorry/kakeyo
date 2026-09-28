import { describe, expect, it } from 'vitest';
import type { TableRow } from '@/features/bank';
import { buildMonthEndTrend } from './month-ends';

// 月末時点の総資産と先月比の Vitest（純粋関数）。

function row(createdDate: string, sum: number | null): TableRow {
  return { createdDate, bankPrices: [], sum };
}

describe('buildMonthEndTrend', () => {
  it('直近 6 か月の月末時点の値を出し、記録の無い月は前の値を引き継ぐ', () => {
    const trend = buildMonthEndTrend(
      [
        row('2026-04-30', 100),
        row('2026-06-15', 120),
        row('2026-08-31', 150),
        row('2026-09-10', 180)
      ],
      '2026-09-25'
    );
    expect(trend).not.toBeNull();
    expect(trend?.points.map((p) => [p.yearMonth, p.label, p.sum])).toEqual([
      ['2026-04', '4月', 100],
      ['2026-05', '5月', 100],
      ['2026-06', '6月', 120],
      ['2026-07', '7月', 120],
      ['2026-08', '8月', 150],
      ['2026-09', '9月', 180]
    ]);
    expect(trend?.lastMonthDiff).toBe(30);
  });

  it('同じ月に複数の記録があれば月末に最も近いものを採る', () => {
    const trend = buildMonthEndTrend(
      [row('2026-09-01', 100), row('2026-09-20', 130)],
      '2026-09-25'
    );
    expect(trend?.points.at(-1)?.sum).toBe(130);
  });

  it('6 か月より前の記録しか無ければ全ての月がその値になり、先月比は 0', () => {
    const trend = buildMonthEndTrend([row('2026-01-31', 500)], '2026-09-25');
    expect(trend?.points.map((p) => p.sum)).toEqual([
      500, 500, 500, 500, 500, 500
    ]);
    expect(trend?.lastMonthDiff).toBe(0);
  });

  it('最初の記録より前の月は null（点を打たない）', () => {
    const trend = buildMonthEndTrend([row('2026-08-05', 300)], '2026-09-25');
    expect(trend?.points.map((p) => p.sum)).toEqual([
      null,
      null,
      null,
      null,
      300,
      300
    ]);
    expect(trend?.lastMonthDiff).toBe(0);
  });

  it('先月末時点の値が無ければ先月比は null', () => {
    const trend = buildMonthEndTrend([row('2026-09-05', 300)], '2026-09-25');
    expect(trend?.points.at(-1)?.sum).toBe(300);
    expect(trend?.points.at(-2)?.sum).toBeNull();
    expect(trend?.lastMonthDiff).toBeNull();
  });

  it('年を跨いで 6 か月を数える', () => {
    const trend = buildMonthEndTrend([row('2025-08-01', 10)], '2026-02-10');
    expect(trend?.points.map((p) => p.label)).toEqual([
      '9月',
      '10月',
      '11月',
      '12月',
      '1月',
      '2月'
    ]);
    expect(trend?.points[0]?.yearMonth).toBe('2025-09');
  });

  it('値のある記録が無ければ null', () => {
    expect(buildMonthEndTrend([], '2026-09-25')).toBeNull();
    expect(
      buildMonthEndTrend([row('2026-09-01', null)], '2026-09-25')
    ).toBeNull();
  });

  it('記録が全て未来の月（今日より後）なら null', () => {
    expect(buildMonthEndTrend([row('2026-10-01', 1)], '2026-09-25')).toBeNull();
  });
});
