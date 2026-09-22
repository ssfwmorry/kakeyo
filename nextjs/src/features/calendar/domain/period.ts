// カレンダーの年月ナビの純粋計算（'YYYY-MM' の前後移動・表示ラベル）。
// summary の period.ts と同型の等価計算だが、feature 境界を跨いで依存しないよう
// calendar 側にも小さく持つ（どちらも server-only を含まない純粋関数）。

// 'YYYY-MM' を月単位で delta 移動する（delta は ±整数）。
export function shiftMonth(yearMonth: string, delta: number): string {
  const [yearStr, monthStr] = yearMonth.split('-');
  const total = Number(yearStr) * 12 + (Number(monthStr) - 1) + delta;
  const newYear = Math.floor(total / 12);
  const newMonth = (total % 12) + 1;
  return `${String(newYear).padStart(4, '0')}-${String(newMonth).padStart(2, '0')}`;
}

// 'YYYY-MM' の表示ラベル（'2026年9月'）。
export function monthLabel(yearMonth: string): string {
  const [yearStr, monthStr] = yearMonth.split('-');
  return `${yearStr}年${Number(monthStr)}月`;
}
