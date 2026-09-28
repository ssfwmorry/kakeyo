// カレンダーの年月ナビの純粋計算（'YYYY-MM' の前後移動・表示ラベル）。
// feature 境界を跨いで依存しないよう calendar 側にも小さく持つ純粋関数。

const MIN_YEAR = 2000;
const MAX_YEAR = 2099;

// 'YYYY-MM' を月単位で delta 移動する（delta は ±整数）。
// サポート範囲（2000-01〜2099-12）外へは移動せず、範囲端でクランプして進めない。
export function shiftMonth(yearMonth: string, delta: number): string {
  const [yearStr, monthStr] = yearMonth.split('-');
  const total = Number(yearStr) * 12 + (Number(monthStr) - 1) + delta;
  const minTotal = MIN_YEAR * 12; // 2000-01
  const maxTotal = MAX_YEAR * 12 + 11; // 2099-12
  const clamped = Math.min(Math.max(total, minTotal), maxTotal);
  const newYear = Math.floor(clamped / 12);
  const newMonth = (clamped % 12) + 1;
  return `${String(newYear).padStart(4, '0')}-${String(newMonth).padStart(2, '0')}`;
}

// 'YYYY-MM' の表示ラベル（'2026年9月'）。
export function monthLabel(yearMonth: string): string {
  const [yearStr, monthStr] = yearMonth.split('-');
  return `${yearStr}年${Number(monthStr)}月`;
}
