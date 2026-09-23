import type { RecordListItem } from '@/features/record';
import { toDateStringJst } from '@/lib/shared/domain/date';
import { getHolidayName } from '@/lib/shared/domain/holiday';
import type { DaySum } from '../types';
import { resolveDisplayIsPay } from './record-sign';

// カレンダーの日別収支を組み立てるドメイン純粋関数（server/client 双方から使える）。
// 祝日名は JST 暦日に対して引く。

// 1 record の「自分視点の符号付き金額」を出す。
// - 支払方向は resolveDisplayIsPay に集約（精算/null は isSelf）。表示側の符号と同じ関数を
//   使い、集計と表示の食い違いを防ぐ。
// - price=0 または支払（isPay=true）は正、そうでなければ負。
// - 自分の record か精算のみ月/日合計に効く（相手の純個人 record は 0）。
function selfSignedPrice(record: RecordListItem): number {
  const isPay = resolveDisplayIsPay(record);
  const recordPrice =
    record.price === 0 || isPay ? record.price : record.price * -1;
  return record.isSelf || record.isSettlement === true ? recordPrice : 0;
}

// dateStr は JST 暦日。
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
  return [...map.values()].sort((a, b) => a.dateStr.localeCompare(b.dateStr));
}

// 日別収支から対象月（YYYY-MM）の合計を出す。デモの月収支は DB 集計（getMonthSum）を
// 呼べないため、モック record から組んだ日別収支を同じ符号規則で足し上げて代用する
// （selfSignedPrice と getMonthSum の SQL は同じ「自分視点の符号」を採る）。
export function sumMonthFromDays(days: DaySum[], yearMonth: string): number {
  return days
    .filter((day) => day.dateStr.startsWith(`${yearMonth}-`))
    .reduce((total, day) => total + day.sum, 0);
}
