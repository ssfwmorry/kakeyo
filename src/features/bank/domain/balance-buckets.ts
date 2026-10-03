import { dateInMonthJst, lastDayOfMonthJst } from '@/lib/shared/domain/date';
import type { TableRow } from './balance-table';
import { type HistoryRange, RANGE_BUCKETS } from './history-range';

// 残高の記録（不定期）を、暦に揃えた区間の「末日時点の値」に写す（純粋関数）。
//
// 残高は次に記録されるまで変わらないものとみなすので、区間末日以前で最後の記録を
// その区間の値にする。区間に記録が無くても直前の記録が引き継がれ、記録が始まる前の
// 区間だけが空になる。いまの区間（進行中）は最新の記録値で描く。

export type BalanceBucket = {
  // 区間末の 'YYYY-MM'。選択の識別子。
  key: string;
  // 棒の下の文字。月ごとは「9月」、四半期・半年は年の最初の区間にだけ「2026」。
  label: string;
  // 採用した記録日。区間末日までに記録が無ければ null（棒を出さない）。
  asOfDate: string | null;
  // 口座ごとの残高（banks と同じ並び・前行引き継ぎ済み）。空の区間は空配列。
  prices: (number | null)[];
  sum: number | null;
};

// rows は記録日昇順（buildBalanceTable の出力）。today は 'YYYY-MM-DD'。
export function buildBalanceBuckets(
  rows: TableRow[],
  today: string,
  range: HistoryRange
): BalanceBucket[] {
  const { months, count } = RANGE_BUCKETS[range];
  const currentEnd = bucketEndMonth(today, months);

  // rows は昇順なので、区間を古い順に見ながら「末日以前で最後の行」を進める。
  let lastIndex = -1;
  const buckets: BalanceBucket[] = [];
  for (let position = 0; position < count; position++) {
    const offset = -(count - 1 - position) * months;
    const endDate = lastDayOfMonthJst(dateInMonthJst(currentEnd, offset, 1));
    while (
      lastIndex + 1 < rows.length &&
      rows[lastIndex + 1].createdDate <= endDate
    ) {
      lastIndex++;
    }
    buckets.push(toBucket(endDate, months, rows[lastIndex]));
  }
  return buckets;
}

// today を含む区間の末の年月。四半期なら 3・6・9・12 月、半年なら 6・12 月。
function bucketEndMonth(today: string, months: number): string {
  const year = today.slice(0, 4);
  const month = Number(today.slice(5, 7));
  const endMonth = Math.ceil(month / months) * months;
  return `${year}-${String(endMonth).padStart(2, '0')}`;
}

function toBucket(
  endDate: string,
  months: number,
  row: TableRow | undefined
): BalanceBucket {
  const key = endDate.slice(0, 7);
  return {
    key,
    label: bucketLabel(key, months),
    asOfDate: row?.createdDate ?? null,
    prices: row?.bankPrices ?? [],
    sum: row?.sum ?? null
  };
}

function bucketLabel(key: string, months: number): string {
  const month = Number(key.slice(5));
  if (months === 1) {
    return `${month}月`;
  }
  // month === months が年の最初の区間（Q1 の 3 月末、上半期の 6 月末）。
  return month === months ? key.slice(0, 4) : '';
}

// 最初に選んでおく区間 = 値のある最新の区間。1 つも無ければ null（グラフを出さない）。
export function latestBucketKey(buckets: BalanceBucket[]): string | null {
  return buckets.findLast((bucket) => bucket.asOfDate !== null)?.key ?? null;
}

// 選んだ区間と 1 つ前の区間の差。どちらかが無い・空なら出せない。
export function bucketDiff(
  current: BalanceBucket | undefined,
  previous: BalanceBucket | undefined
): number | null {
  if (current?.sum == null || previous?.sum == null) {
    return null;
  }
  return current.sum - previous.sum;
}
