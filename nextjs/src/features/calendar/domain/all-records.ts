import type { RecordListItem } from '@/features/record';

// 全記録一覧（旧 calendar.vue showAllRecords）のフィルタ・並べ替え（純粋関数・Vitest）。
// days は既に期間内集合なので、当月（yearMonth 一致）かつ記録のある日だけを残し、
// 指定の並び順（asc=昇順 / desc=降順）で日付ソートする（旧 isInMonth && records.length>0）。

type DayLike = { dateStr: string; records: RecordListItem[] };

export type AllRecordsOrder = 'asc' | 'desc' | null;

export function selectAllRecordDays<T extends DayLike>(
  days: T[],
  yearMonth: string,
  order: 'asc' | 'desc'
): T[] {
  const sign = order === 'asc' ? 1 : -1;
  return days
    .filter(
      (day) => day.records.length > 0 && day.dateStr.startsWith(`${yearMonth}-`)
    )
    .sort((a, b) =>
      a.dateStr < b.dateStr ? -sign : a.dateStr > b.dateStr ? sign : 0
    );
}

// 全記録トグルの次の状態（旧: null→desc、desc→asc、asc→desc の交互）。
export function nextAllRecordsOrder(prev: AllRecordsOrder): AllRecordsOrder {
  if (prev === null) {
    return 'desc';
  }
  return prev === 'desc' ? 'asc' : 'desc';
}
