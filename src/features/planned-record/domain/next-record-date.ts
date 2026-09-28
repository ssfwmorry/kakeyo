import { dateInMonthJst } from '@/lib/shared/domain/date';

// 定期の記録が次に作られる日。選んだ日が今日より後ならその月、そうでなければ翌月。
// 今日と同じ日は「今日の分はもう作られている」とみなして翌月にする。
export function nextPlannedRecordDate(today: string, day: number): string {
  const yearMonth = today.slice(0, 7);
  const todayDay = Number(today.slice(8, 10));
  return dateInMonthJst(yearMonth, day > todayDay ? 0 : 1, day);
}
