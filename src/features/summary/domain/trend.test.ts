import { describe, expect, it } from 'vitest';
import type { PayIncomeShowData, StackSeries } from './chart-data';
import {
  buildLegend,
  buildSignedBars,
  buildStackedBars,
  buildTrendTable
} from './trend';

// 推移の棒とテーブルの Vitest（純粋関数）。
// 高さは 150px を値に割り当て、上端に 5px の余白を置く（原典 SumTrend と同じ）。

describe('buildSignedBars', () => {
  it('正負で 150px を分け合い、0 線の位置が動く', () => {
    const { bars, zeroTop } = buildSignedBars([100, -50, 0], 'pos', 'neg');

    // 正 100 : 負 50 なので 150px を 100px / 50px に分ける。
    expect(zeroTop).toBe(105);
    expect(bars[0]).toMatchObject({
      key: '1',
      label: '1月',
      top: 5,
      height: 100,
      isNegative: false,
      value: 100
    });
    expect(bars[0].segments).toEqual([
      { key: 'total', height: 100, color: 'pos' }
    ]);
    // 負は 0 線から下へ伸びる。
    expect(bars[1]).toMatchObject({ top: 105, height: 50, isNegative: true });
    expect(bars[1].segments).toEqual([
      { key: 'total', height: 50, color: 'neg' }
    ]);
  });

  it('0 は高さ 0、0 でない小さな値は 2px まで残す', () => {
    const { bars } = buildSignedBars([1000, 0, 1], 'pos', 'neg');

    expect(bars[1].height).toBe(0);
    expect(bars[2].height).toBe(2);
  });

  it('全て 0 でも 0 除算しない', () => {
    const { bars, zeroTop } = buildSignedBars([0, 0], 'pos', 'neg');

    expect(zeroTop).toBe(155);
    expect(bars.every((bar) => bar.height === 0)).toBe(true);
  });

  it('全て正なら 0 線は下端に来る', () => {
    const { bars, zeroTop } = buildSignedBars([100, 50], 'pos', 'neg');

    expect(zeroTop).toBe(155);
    expect(bars[0]).toMatchObject({ top: 5, height: 150 });
    expect(bars[1]).toMatchObject({ top: 80, height: 75 });
  });
});

const series: StackSeries[] = [
  { key: 'a', label: '食費', colorName: 'ca' },
  { key: 'b', label: '外食', colorName: 'cb' }
];

// 色名 → CSS 色の解決は画面（colorVar）の役目なので、テストでは素通しする。
const toColor = (colorName: string) => colorName;

describe('buildStackedBars', () => {
  it('合計の最大を 150px にし、系列を下から積む', () => {
    const rows = [
      { month: '1', a: 60, b: 40 },
      { month: '2', a: 25, b: 25 }
    ];
    const { bars, zeroTop } = buildStackedBars(rows, series, toColor);

    // 積み上げは全て上向きなので 0 線は下端。
    expect(zeroTop).toBe(155);
    // 合計 100 が最大なので 150px。
    expect(bars[0]).toMatchObject({ top: 5, height: 150, isNegative: false });
    expect(bars[0].segments).toEqual([
      { key: 'a', height: 90, color: 'ca' },
      { key: 'b', height: 60, color: 'cb' }
    ]);
    // 合計 50 は半分の 75px。
    expect(bars[1]).toMatchObject({ top: 80, height: 75, value: 50 });
  });

  it('値の無い月は高さ 0 になる', () => {
    const rows = [
      { month: '1', a: 100, b: 0 },
      { month: '2', a: 0, b: 0 }
    ];
    const { bars } = buildStackedBars(rows, series, toColor);

    expect(bars[1].height).toBe(0);
    expect(bars[1].value).toBe(0);
  });
});

describe('buildLegend', () => {
  it('積み上げの逆順に並べ、年間と選択月の値を出す', () => {
    const rows = [
      { month: '1', a: 60, b: 40 },
      { month: '2', a: 25, b: 25 }
    ];
    const legend = buildLegend(rows, series, 2);

    // 上に積まれた b が先頭。
    expect(legend.map((row) => row.key)).toEqual(['b', 'a']);
    expect(legend[0]).toEqual({
      key: 'b',
      name: '外食',
      colorName: 'cb',
      total: 65,
      selected: 25
    });
    expect(legend[1]).toMatchObject({ total: 85, selected: 25 });
  });

  it('選択月に行が無くても 0 を返す', () => {
    const legend = buildLegend([{ month: '1', a: 10, b: 0 }], series, 12);

    expect(legend[1].selected).toBe(0);
  });
});

describe('buildTrendTable', () => {
  const data: PayIncomeShowData = {
    rows: [
      { month: '1', pay: 100, income: 300, payAndIncome: 200 },
      { month: '2', pay: 0, income: 0, payAndIncome: 0 },
      { month: '3', pay: 500, income: 300, payAndIncome: -200 }
    ],
    sumPay: 600,
    sumPayAndIncome: 0
  };

  it('12 か月の行と年計を出す', () => {
    const table = buildTrendTable(data);

    expect(table.rows[0]).toEqual({
      month: 1,
      pay: 100,
      income: 300,
      balance: 200,
      isEmpty: false
    });
    expect(table.sumPay).toBe(600);
    expect(table.sumIncome).toBe(600);
    expect(table.sumBalance).toBe(0);
  });

  it('支出も収入も無い月を空として印す', () => {
    const table = buildTrendTable(data);

    expect(table.rows[1].isEmpty).toBe(true);
    expect(table.rows[2].isEmpty).toBe(false);
  });
});
