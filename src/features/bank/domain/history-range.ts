// 口座の推移で選べる期間と、期間ごとの区間の粗さ。
//
// 棒の本数を 12 本以下に揃えるため、期間が長いほど区間を粗くする
// （1 年は月、3 年は四半期、5 年は半年）。本数が揃うので横幅の密度が期間で変わらない。

export const HISTORY_RANGES = ['1y', '3y', '5y'] as const;
export type HistoryRange = (typeof HISTORY_RANGES)[number];

export const DEFAULT_RANGE: HistoryRange = '1y';

// 残高記録の遡及年数。リポジトリの取得下限もこれに合わせる（選べる最長期間と一致させる）。
export const MAX_HISTORY_YEARS = 5;

// months = 1 区間の月数、count = 区間の数（= 棒の本数）。
export const RANGE_BUCKETS: Record<
  HistoryRange,
  { months: number; count: number }
> = {
  '1y': { months: 1, count: 12 },
  '3y': { months: 3, count: 12 },
  '5y': { months: 6, count: 10 }
};
