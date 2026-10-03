// 月/年ナビの純粋計算（server-only を含まない = Client / Vitest 双方から使う）。
// 'YYYY-MM' 文字列と year(number) を、暦を跨いで前後に動かす。

// サポートする年の範囲。
const MIN_YEAR = 2000;
const MAX_YEAR = 2099;

// 'YYYY-MM' を月単位で delta 移動する（delta は ±整数）。
// サポート範囲（2000-01〜2099-12）外へは移動せず、範囲端で頭打ちにする。
export function shiftMonth(yearMonth: string, delta: number): string {
  const [yearStr, monthStr] = yearMonth.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr); // 1..12
  // 0-indexed に直して加算 → 正規化。
  const total = year * 12 + (month - 1) + delta;
  const minTotal = MIN_YEAR * 12; // 2000-01
  const maxTotal = MAX_YEAR * 12 + 11; // 2099-12
  const clamped = Math.min(Math.max(total, minTotal), maxTotal);
  const newYear = Math.floor(clamped / 12);
  const newMonth = (clamped % 12) + 1;
  return `${String(newYear).padStart(4, '0')}-${String(newMonth).padStart(2, '0')}`;
}

// year を delta 移動する（delta は ±整数）。サポート範囲（2000〜2099）で頭打ちにする。
// 推移/カテゴリ別の年ナビで使う。
export function shiftYear(year: number, delta: number): number {
  return Math.min(Math.max(year + delta, MIN_YEAR), MAX_YEAR);
}

export function yearLabel(year: number): string {
  return `${year}年`;
}

// month は 1..12（Date の 0 始まりではない）。
export function splitYearMonth(yearMonth: string): {
  year: number;
  month: number;
} {
  const [yearStr, monthStr] = yearMonth.split('-');
  return { year: Number(yearStr), month: Number(monthStr) };
}
