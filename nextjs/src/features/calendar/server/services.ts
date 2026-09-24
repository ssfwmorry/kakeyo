import 'server-only';
import { withDemoRead } from '@/features/demo/server/inject';
import {
  getPlanList,
  getReminderList
} from '@/features/plan-reminder/server/services';
import { getRecordListForRange } from '@/features/record/server/services';
import { getMonthSum } from '@/features/summary/server/repositories/summary';
import type { SessionData } from '@/lib/shared/types/auth';
import { buildDaySumList, sumMonthFromDays } from '../domain/day-sum';
import { calcCalendarRange } from '../domain/range';
import type { CalendarMonthData } from '../types';

// calendar の取得サービス（server-only・純粋読み取り）。
// 表示から副作用を排除するため、定期 record の実体化 INSERT（postRecords）は絶対に呼ばない
//   （定期実体化は Cron に移譲済み。/api/cron/post-records）。ここは record/plan/reminder/月収支の取得のみ。
//
// scope（userUid/pairId）は session から確定し、各サービス/リポジトリが自分/ペアに絞る。
// getMonthSum は summary services に未公開のため repositories を直 import する。

// ひと月分のカレンダーデータ（日別収支・予定・リマインダー・月収支合計）を取得する。
export async function getCalendarMonth(
  session: SessionData,
  yearMonth: string
): Promise<CalendarMonthData> {
  const range = calcCalendarRange(yearMonth);

  const [records, plans, reminderGroups] = await Promise.all([
    getRecordListForRange(session, range.startDate, range.endDate),
    getPlanList(session, { start: range.startStr, end: range.endStr }),
    getReminderList(session)
  ]);
  const days = buildDaySumList(records, range);

  const monthSum = await withDemoRead(
    session,
    () => sumMonthFromDays(days, yearMonth),
    () =>
      getMonthSum(
        { userUid: session.userUid, pairId: session.pairId },
        yearMonth
      )
  );

  return {
    yearMonth,
    monthSum,
    days,
    plans,
    reminders: reminderGroups.all
  };
}
