import type { RecordListItem } from '@/features/record';
import { toDateStringJst } from '@/lib/shared/domain/date';
import { getHolidayName } from '@/lib/shared/domain/holiday';
import type { DaySum } from '../types';
import { resolveDisplayIsPay } from './record-sign';

// カレンダーの日別収支を組み立てるドメイン純粋関数（server/client 双方から使える）。
// 旧 useCalendarStore.getDaySumList の移植。record を日付キーで畳み込み、自分視点の
// 当日収支（sum）を出す。祝日名は date.ts の JST 暦日に対して getHolidayName で引く。

// 1 record の「自分視点の符号付き金額」を出す。
// - 支払方向（isPay 相当）は resolveDisplayIsPay に集約（精算/null は isSelf）。表示側の
//   符号（day-record-list）と同じ関数を使い、集計と表示の食い違いを防ぐ。
// - price=0 または支払（isPay=true）は正、そうでなければ負。
// - 自分の record か精算のみ月/日合計に効く（相手の純個人 record は 0）。
function selfSignedPrice(record: RecordListItem): number {
  const isPay = resolveDisplayIsPay(record);
  const recordPrice =
    record.price === 0 || isPay ? record.price : record.price * -1;
  return record.isSelf || record.isSettlement === true ? recordPrice : 0;
}

// record 一覧を日別収支へ畳み込む。dateStr は JST 暦日。
export function buildDaySumList(records: RecordListItem[]): DaySum[] {
  const map = new Map<string, DaySum>();
  for (const record of records) {
    const dateStr = toDateStringJst(record.datetime);
    let day = map.get(dateStr);
    if (!day) {
      day = {
        dateStr,
        sum: 0,
        records: [],
        holidayName: getHolidayName(dateStr)
      };
      map.set(dateStr, day);
    }
    day.records.push(record);
    day.sum += selfSignedPrice(record);
  }
  // dateStr 昇順で返す（表示側の並びを安定させる）。
  return [...map.values()].sort((a, b) => a.dateStr.localeCompare(b.dateStr));
}
