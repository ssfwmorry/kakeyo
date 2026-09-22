import { toYearMonthJst } from '@/lib/shared/domain/date';

// 月/年ナビの純粋計算（server-only を含まない = Client / Vitest 双方から使う）。
// 'YYYY-MM' 文字列と year(number) を、暦を跨いで前後に動かす。

// 'YYYY-MM' を月単位で delta 移動する（delta は ±整数）。
export function shiftMonth(yearMonth: string, delta: number): string {
  const [yearStr, monthStr] = yearMonth.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr); // 1..12
  // 0-indexed に直して加算 → 正規化。
  const total = year * 12 + (month - 1) + delta;
  const newYear = Math.floor(total / 12);
  const newMonth = (total % 12) + 1;
  return `${String(newYear).padStart(4, '0')}-${String(newMonth).padStart(2, '0')}`;
}

// 'YYYY-MM' の表示ラベル（'2026年9月'）。
export function monthLabel(yearMonth: string): string {
  const [yearStr, monthStr] = yearMonth.split('-');
  return `${yearStr}年${Number(monthStr)}月`;
}

// 年の表示ラベル。
export function yearLabel(year: number): string {
  return `${year}年`;
}

// JST の「今月」を 'YYYY-MM' で返す（初期表示の起点）。
export function currentYearMonth(): string {
  return toYearMonthJst(new Date());
}

// JST の「今年」を number で返す。
export function currentYear(): number {
  return Number(currentYearMonth().split('-')[0]);
}
