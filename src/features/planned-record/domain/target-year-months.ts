// 定期実体化の対象年月の列挙と打ち切り。
//
// 実体化が意味を持つのは当月〜7 ヶ月後だけ:
// - 過去月: 実体化 SQL の `datetime > now()` 条件により挿入 0 件
// - 7 ヶ月より先: 閲覧のたびに遠い未来まで record を作り込まないための打ち切り
// Cron は閲覧に依存できないため、基準月（JST の今月）から monthsAhead=7 までの
// 計 8 ヶ月分を毎日列挙する。

const YEAR_MONTH_PATTERN = /^(\d{4})-(\d{2})$/;

// 基準年月（YYYY-MM）から monthsAhead ヶ月後までの年月リストを返す（基準月含む）。
// 日付ライブラリ不要の純粋な年月演算。
export function enumerateTargetYearMonths(
  baseYearMonth: string,
  monthsAhead = 7
): string[] {
  const matched = YEAR_MONTH_PATTERN.exec(baseYearMonth);
  if (!matched) {
    throw new Error(`Invalid yearMonth: ${baseYearMonth}`);
  }
  const year = Number(matched[1]);
  const month = Number(matched[2]);
  if (month < 1 || month > 12) {
    throw new Error(`Invalid yearMonth: ${baseYearMonth}`);
  }

  const result: string[] = [];
  for (let offset = 0; offset <= monthsAhead; offset++) {
    // 0 始まりの通算月に直してから年・月へ戻す（12 月跨ぎを算術で処理）。
    const total = year * 12 + (month - 1) + offset;
    const y = Math.floor(total / 12);
    const m = (total % 12) + 1;
    result.push(`${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}`);
  }
  return result;
}

// カレンダー表示時の実体化で、その月を対象にしてよいか。下限は設けない。
export function isWithinMaterializeHorizon(
  baseYearMonth: string,
  yearMonth: string,
  monthsAhead = 7
): boolean {
  return monthIndex(yearMonth) - monthIndex(baseYearMonth) <= monthsAhead;
}

// YYYY-MM を 0 始まりの通算月に直す（年跨ぎの比較を算術で行うため）。
function monthIndex(yearMonth: string): number {
  const matched = YEAR_MONTH_PATTERN.exec(yearMonth);
  if (!matched) {
    throw new Error(`Invalid yearMonth: ${yearMonth}`);
  }
  const month = Number(matched[2]);
  if (month < 1 || month > 12) {
    throw new Error(`Invalid yearMonth: ${yearMonth}`);
  }
  return Number(matched[1]) * 12 + (month - 1);
}
