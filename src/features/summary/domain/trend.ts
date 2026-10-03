import {
  buildStackedChartBars,
  type ChartBar,
  type ChartBars,
  MIN_BAR_HEIGHT,
  SCALE_HEIGHT,
  TOP_PAD
} from '@/lib/shared/domain/bar-chart';
import type { PayIncomeShowData, StackBarRow, StackSeries } from './chart-data';

// 集計 › 推移（原典 SumTrend）の棒グラフとテーブルの計算（純粋関数）。
// 棒の形の決め方（描画領域・余白）は lib/shared/domain/bar-chart が持つ。

// 積み上げない棒（全体）の唯一の区画に振るキー。
const SINGLE_SERIES_KEY = 'total';

// 棒の key は月（1..12）の文字列。選択月（number）との変換は画面側で行う。
function monthAxisLabel(month: number): string {
  return `${month}月`;
}

// 収支のように正負が混ざる 12 本の棒。0 線をまたいで上下に伸びる。
// 正負それぞれの最大値で 150px を分け合うので、0 線の位置は値によって動く。
export function buildSignedBars(
  values: number[],
  positiveColor: string,
  negativeColor: string
): ChartBars {
  // 全て 0 のときに 0 除算しないよう、正の最大は 1 で下限を張る。
  const positiveMax = Math.max(1, ...values.map((value) => Math.max(value, 0)));
  const negativeMax = Math.max(
    0,
    ...values.map((value) => Math.max(-value, 0))
  );
  const scale = SCALE_HEIGHT / (positiveMax + negativeMax);
  const zeroTop = TOP_PAD + positiveMax * scale;

  const bars = values.map((value, index) => {
    const height =
      value === 0 ? 0 : Math.max(MIN_BAR_HEIGHT, Math.abs(value) * scale);
    const isNegative = value < 0;
    const month = index + 1;
    return {
      key: String(month),
      label: monthAxisLabel(month),
      top: isNegative ? zeroTop : zeroTop - height,
      height,
      isNegative,
      segments: [
        {
          key: SINGLE_SERIES_KEY,
          height,
          color: isNegative ? negativeColor : positiveColor
        }
      ],
      value
    };
  });

  return { bars, zeroTop };
}

// 積み上げの 12 本。全て上向きなので 0 線は描画領域の下端に置く。
// 系列は下から積む順（凡例は逆順に出す）。
export function buildStackedBars(
  rows: StackBarRow[],
  series: StackSeries[],
  toColor: (colorName: string) => string
): ChartBars {
  return buildStackedChartBars(
    rows.map((row, index) => ({
      key: String(index + 1),
      label: monthAxisLabel(index + 1),
      values: series.map((one) => toValue(row[one.key]))
    })),
    series.map((one) => ({ key: one.key, color: toColor(one.colorName) }))
  );
}

// 凡例の 1 行。
export type TrendLegendRow = {
  key: string;
  name: string;
  colorName: string;
  // 年間の合計。
  total: number;
  // 選択中の月の値。
  selected: number;
};

// 凡例は積み上げの逆順（上に積まれたものが先頭）に並べる。
export function buildLegend(
  rows: StackBarRow[],
  series: StackSeries[],
  selectedMonth: number
): TrendLegendRow[] {
  return series
    .map((one) => ({
      key: one.key,
      name: one.label,
      colorName: one.colorName,
      total: rows.reduce((sum, row) => sum + toValue(row[one.key]), 0),
      selected: toValue(rows[selectedMonth - 1]?.[one.key])
    }))
    .reverse();
}

// 月別テーブルの 1 行。
export type TrendTableRow = {
  month: number;
  pay: number;
  income: number;
  balance: number;
  // その月に記録が無い（支出も収入も 0）。数字の色を落とす。
  isEmpty: boolean;
};

export type TrendTable = {
  rows: TrendTableRow[];
  sumPay: number;
  sumIncome: number;
  sumBalance: number;
};

// 12 か月ぶんの支出・収入・収支と年計。
// buildPayIncomeBar が欠損月を 0 で埋めた 12 行を渡す前提。
export function buildTrendTable(data: PayIncomeShowData): TrendTable {
  const rows = data.rows.map((row, index) => ({
    month: index + 1,
    pay: row.pay,
    income: row.income,
    balance: row.payAndIncome,
    isEmpty: row.pay === 0 && row.income === 0
  }));

  return {
    rows,
    sumPay: data.sumPay,
    sumIncome: rows.reduce((sum, row) => sum + row.income, 0),
    sumBalance: data.sumPayAndIncome
  };
}

// StackBarRow は month（文字列）と系列の値が同居するので、数値だけを取り出す。
function toValue(cell: number | string | undefined): number {
  return typeof cell === 'number' ? cell : 0;
}

// 「いま何を見ているか」。見方の切替とピルの組み合わせで決まり、
// 見出しの対象名・符号の有無・年間合計の出どころがこれで決まる。
export type TrendView =
  // 全体・収支（0 線をまたぐ。負になりうるので符号つき）。
  | { kind: 'balance' }
  // 全体・支出のみ。
  | { kind: 'pay' }
  // カテゴリ別（「全て」= カテゴリの積み上げ、カテゴリを選べばサブカテゴリの積み上げ）。
  | { kind: 'byType'; targetName: string };

// 収支だけが負になりうる。他は量なので符号を付けない。
export function isSignedView(view: TrendView): boolean {
  return view.kind === 'balance';
}

// 見出しの対象名（「2026年の収支」の「収支」の部分）。
export function trendTargetName(
  view: TrendView,
  labels: { balance: string; pay: string }
): string {
  if (view.kind === 'byType') {
    return view.targetName;
  }
  return view.kind === 'balance' ? labels.balance : labels.pay;
}

// 年間の合計。全体はテーブルの年計、カテゴリ別は棒の合計から出す。
export function trendYearTotal(
  view: TrendView,
  table: TrendTable,
  bars: ChartBar[]
): number {
  if (view.kind === 'balance') {
    return table.sumBalance;
  }
  if (view.kind === 'pay') {
    return table.sumPay;
  }
  return bars.reduce((sum, bar) => sum + bar.value, 0);
}
