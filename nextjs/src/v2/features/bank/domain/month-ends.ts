import type { TableRow } from '@/features/bank';
import { dateInMonthJst, lastDayOfMonthJst } from '@/lib/shared/domain/date';

// 口座タブの推移（原典 Bank）。記録日ごとの総資産から「各月末時点の総資産」を
// 直近 6 か月ぶん取り出す。残高の記録は利用者任せの間隔なので、月末に記録が無い月は
// その時点で最後に記録された値（= 前月までの値）をそのまま引き継ぐ。
//
// 先月比は「今月末時点」と「先月末時点」の差。今月はまだ終わっていないが、
// 今月末時点 = いまの最新値なので、これで「先月末からいくら増えたか」になる。

export const TREND_MONTHS = 6;

export type MonthEndPoint = {
  // 'YYYY-MM'。
  yearMonth: string;
  // X 軸のラベル（'9月'）。
  label: string;
  // その月末時点の総資産。それ以前に記録が無ければ null（点を打たない）。
  sum: number | null;
};

export type MonthEndTrend = {
  points: MonthEndPoint[];
  lastMonthDiff: number | null;
};

// rows は記録日昇順（buildBalanceTable の出力）。値のある記録が 1 つも無ければ null。
export function buildMonthEndTrend(
  rows: TableRow[],
  today: string,
  months = TREND_MONTHS
): MonthEndTrend | null {
  const valued = rows.filter(
    (row): row is TableRow & { sum: number } => row.sum !== null
  );
  if (valued.length === 0) {
    return null;
  }

  const thisMonth = today.slice(0, 7);
  const points: MonthEndPoint[] = [];
  for (let offset = months - 1; offset >= 0; offset--) {
    const firstDay = dateInMonthJst(thisMonth, -offset, 1);
    const monthEnd = lastDayOfMonthJst(firstDay);
    const yearMonth = firstDay.slice(0, 7);
    points.push({
      yearMonth,
      label: `${Number(yearMonth.slice(5))}月`,
      sum: sumAt(valued, monthEnd)
    });
  }

  if (points.every((point) => point.sum === null)) {
    return null;
  }

  const last = points.at(-1)?.sum ?? null;
  const previous = points.at(-2)?.sum ?? null;
  return {
    points,
    lastMonthDiff: last === null || previous === null ? null : last - previous
  };
}

// date 時点の総資産 = date 以前で最後に記録された値。
function sumAt(
  rows: (TableRow & { sum: number })[],
  date: string
): number | null {
  let found: number | null = null;
  for (const row of rows) {
    if (row.createdDate > date) {
      break;
    }
    found = row.sum;
  }
  return found;
}
