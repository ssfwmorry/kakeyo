import type { SummarizedRecordItem } from '@/features/record';
import { toDateStringJst } from '@/lib/shared/domain/date';

// 明細（内訳の行をタップした先）の日別グループ化。純粋関数。
//
// サービス層は日時降順で返すので、並べ替えはせず順番どおりに日で束ねる。
// 合計・日計は表示のたびに数えず、ここで 1 度だけ出す。

export type RecordsDayGroup = {
  // 'YYYY-MM-DD'（見出しの書式は表示側が決める）。
  date: string;
  items: SummarizedRecordItem[];
  // その日の合計（符号なしの生値）。
  sum: number;
};

export type RecordsGroups = {
  days: RecordsDayGroup[];
  // 月の合計（符号なしの生値）。
  total: number;
};

export function groupRecordsByDay(
  records: SummarizedRecordItem[]
): RecordsGroups {
  const days: RecordsDayGroup[] = [];
  const indexByDate = new Map<string, number>();
  let total = 0;

  for (const record of records) {
    const date = toDateStringJst(record.datetime);
    let index = indexByDate.get(date);
    if (index === undefined) {
      index = days.length;
      indexByDate.set(date, index);
      days.push({ date, items: [], sum: 0 });
    }
    days[index].items.push(record);
    days[index].sum += record.price;
    total += record.price;
  }

  return { days, total };
}
