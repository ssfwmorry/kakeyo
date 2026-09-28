import type { PayIncomeShowData, StackBarRow, StackSeries } from './chart-data';

// 集計 › 推移（原典 SumTrend）の棒グラフとテーブルの計算（純粋関数）。
//
// グラフは div の高さだけで描くので SVG は使わない（口座の折れ線とは違い、
// 積み上げと 0 線の位置さえ出れば形が決まる）。
// 描画領域は 160px で、上下に 5px ずつ余白を残した 150px を値に割り当てる。

// 棒の描画領域（px）。
export const CHART_HEIGHT = 160;
// 値に割り当てる高さ。上下の余白 5px ずつを差し引いたもの。
const SCALE_HEIGHT = 150;
// 描画領域の上端から値域が始まるまでの余白。
const TOP_PAD = 5;
// 0 でない値が潰れて見えなくならない最低の高さ。
const MIN_BAR_HEIGHT = 2;
// 積み上げない棒（全体）の唯一の区画に振るキー。
const SINGLE_SERIES_KEY = 'total';

// 積み上げの 1 区画。色は CSS の色として使える文字列
// （全体は var(--primary) 等、カテゴリ別は colorVar が解決した var(--cat-*)）。
export type BarSegment = {
  // 系列のキー（全体は単色なので固定値）。
  key: string;
  height: number;
  color: string;
};

// 棒 1 本。top は描画領域の上端からの位置。
export type TrendBar = {
  // 1..12。
  month: number;
  top: number;
  height: number;
  // 下向きの棒は角丸を下に付ける。
  isNegative: boolean;
  // 下から積む順（column-reverse で描く）。
  segments: BarSegment[];
  // 棒が表す合計（符号つき）。ラベルと選択月の値に使う。
  value: number;
};

export type SignedBars = {
  bars: TrendBar[];
  // 0 線の位置（描画領域の上端から）。
  zeroTop: number;
};

// 収支のように正負が混ざる 12 本の棒。0 線をまたいで上下に伸びる。
// 正負それぞれの最大値で 150px を分け合うので、0 線の位置は値によって動く。
export function buildSignedBars(
  values: number[],
  positiveColor: string,
  negativeColor: string
): SignedBars {
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
    return {
      month: index + 1,
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
): SignedBars {
  const totals = rows.map((row) =>
    series.reduce((total, one) => total + toValue(row[one.key]), 0)
  );
  // 全て 0 のときに 0 除算しない。
  const max = Math.max(1, ...totals);
  const scale = SCALE_HEIGHT / max;

  const bars = totals.map((total, index) => {
    const height = total * scale;
    return {
      month: index + 1,
      top: TOP_PAD + SCALE_HEIGHT - height,
      height,
      isNegative: false,
      segments: series.map((one) => ({
        key: one.key,
        height: toValue(rows[index][one.key]) * scale,
        color: toColor(one.colorName)
      })),
      value: total
    };
  });

  return { bars, zeroTop: TOP_PAD + SCALE_HEIGHT };
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
  bars: TrendBar[]
): number {
  if (view.kind === 'balance') {
    return table.sumBalance;
  }
  if (view.kind === 'pay') {
    return table.sumPay;
  }
  return bars.reduce((sum, bar) => sum + bar.value, 0);
}
