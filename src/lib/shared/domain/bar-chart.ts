// 棒グラフの形の計算（純粋関数）。集計 › 推移と口座の残高推移が同じ描画部品
// （components/stacked-bar-chart）に渡す形をここで決める。
//
// グラフは div の高さだけで描くので SVG は使わない（積み上げと 0 線の位置さえ出れば
// 形が決まる）。

// 棒の描画領域（px）。
export const CHART_HEIGHT = 160;
// 値に割り当てる高さ。上下の余白 5px ずつを差し引いたもの。
export const SCALE_HEIGHT = 150;
// 描画領域の上端から値域が始まるまでの余白。
export const TOP_PAD = 5;
// 0 でない値が潰れて見えなくならない最低の高さ。
export const MIN_BAR_HEIGHT = 2;

// 積み上げの 1 区画。色は CSS の色として使える文字列
// （var(--primary) や colorVar が解決した var(--cat-*)）。
export type BarSegment = {
  key: string;
  height: number;
  color: string;
};

// 棒 1 本。top は描画領域の上端からの位置。
export type ChartBar = {
  // 選択の識別子。
  key: string;
  // 棒の下に出す文字（空なら出さない）。
  label: string;
  top: number;
  height: number;
  // 下向きの棒は角丸を下に付ける。
  isNegative: boolean;
  // 下から積む順（column-reverse で描く）。
  segments: BarSegment[];
  // 棒が表す合計（符号つき）。読み上げ文言と選択中の値に使う。
  value: number;
};

export type ChartBars = {
  bars: ChartBar[];
  // 0 線の位置（描画領域の上端から）。
  zeroTop: number;
};

// 積み上げる 1 本ぶんの入力。values は series と同じ並び（下から積む順）。
export type StackColumn = {
  key: string;
  label: string;
  values: number[];
};

export type StackSeriesColor = {
  key: string;
  color: string;
};

// 全て上向きの積み上げ棒。0 線は描画領域の下端に置き、合計の最大を 150px にする。
export function buildStackedChartBars(
  columns: StackColumn[],
  series: StackSeriesColor[]
): ChartBars {
  const totals = columns.map((column) =>
    column.values.reduce((total, value) => total + value, 0)
  );
  // 全て 0 のときに 0 除算しない。
  const max = Math.max(1, ...totals);
  const scale = SCALE_HEIGHT / max;

  const bars = columns.map((column, index) => {
    const total = totals[index];
    const height = total * scale;
    return {
      key: column.key,
      label: column.label,
      top: TOP_PAD + SCALE_HEIGHT - height,
      height,
      isNegative: false,
      segments: series.map((one, seriesIndex) => ({
        key: one.key,
        height: (column.values[seriesIndex] ?? 0) * scale,
        color: one.color
      })),
      value: total
    };
  });

  return { bars, zeroTop: TOP_PAD + SCALE_HEIGHT };
}
