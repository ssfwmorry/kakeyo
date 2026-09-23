// 棒グラフの軸設定（全体グラフ・カテゴリ別グラフ共有）。
//
// 2 つの棒グラフは意図的に同じ見た目に揃えている。軸幅やフォントサイズを
// コンポーネント側に直書きすると片方だけ調整されて不揃いになるので、
// props をここに集約して spread する（Recharts は YAxis/XAxis を
// <BarChart> の直接の子に要求するため、ラッパ化ではなく props 共有にする）。

import { toAxisTickStr } from '../domain/format';

// 月（1〜12）を並べる X 軸。
export const MONTH_X_AXIS_PROPS = {
  dataKey: 'month',
  tickLine: false,
  axisLine: false,
  tickMargin: 8
} as const;

// 金額の Y 軸。目盛りは万単位に丸めて軸幅を細く保つ。
export const AMOUNT_Y_AXIS_PROPS = {
  tickLine: false,
  axisLine: false,
  width: 40,
  tickMargin: 4,
  tick: { fontSize: 10 },
  tickFormatter: (value: number | string) => toAxisTickStr(Number(value))
} as const;

// ツールチップの金額表記（「1,234 円」）。
export const formatTooltipAmount = (value: unknown): string =>
  `${Number(value).toLocaleString()} 円`;
