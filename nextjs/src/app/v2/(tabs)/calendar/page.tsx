import { requireAuth } from '@/features/auth/server/requireAuth';
import { getCalendarMonth } from '@/features/calendar/server/services';
import {
  getMemoList,
  getShortCutList
} from '@/features/memo-shortcut/server/services';
import { getPlanTypeCardList } from '@/features/plan-reminder/server/services';
import { getEffectivePairMode } from '@/lib/server/pair/mode';
import { todayJst, toYearMonthJst } from '@/lib/shared/domain/date';
import { CalendarScreen } from '@/v2/features/calendar/components/calendar-screen';

// カレンダー（ホーム・新デザイン）。取得は旧画面と同じサービスをそのまま使う。

export default async function V2CalendarPage() {
  const session = await requireAuth();
  const today = todayJst();
  const yearMonth = toYearMonthJst(new Date());

  const [month, memos, shortcuts, isPair, planTypeList] = await Promise.all([
    getCalendarMonth(session, yearMonth),
    getMemoList(session),
    getShortCutList(session),
    getEffectivePairMode(session),
    getPlanTypeCardList(session)
  ]);

  return (
    <CalendarScreen
      planTypeList={planTypeList}
      initial={{
        hasPair: session.pairId !== null,
        isPair,
        memos,
        month,
        shortcuts,
        today
      }}
    />
  );
}
