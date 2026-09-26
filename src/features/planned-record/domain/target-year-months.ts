// 定期実体化バッチの対象年月の列挙。
//
// Cron 化では閲覧に依存できないため「挿入が発生しうる全ての月」を毎日カバーする:
// - 過去月: post_records の `datetime > now()` 条件により挿入 0 件（回す必要なし）
// - 当月〜7 ヶ月後: 実体化対象になりうる全範囲
// よって基準月（JST の今月）から monthsAhead=7 まで、計 8 ヶ月分を列挙する。

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
