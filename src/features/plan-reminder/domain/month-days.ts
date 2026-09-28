// 月日指定リマインダーの「日」選択肢を、選択中の月に応じた日数で生成する純粋関数。
// 月日指定は年を持たない（翌年に丸める）ため、2 月は常に 28 日固定（うるう年は非考慮）とする。
// これにより「4/31」「2/30」等の存在しない月日を選べなくする。

// 各月（1-indexed）の日数。
const DAYS_BY_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31] as const;

// month（1〜12）の日数を返す。範囲外は 31 にフォールバック（安全側）。
export function daysInMonthFixed(month: number): number {
  return DAYS_BY_MONTH[month - 1] ?? 31;
}

export function dayOptionsForMonth(month: number): number[] {
  const last = daysInMonthFixed(month);
  return Array.from({ length: last }, (_, i) => i + 1);
}
