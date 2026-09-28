import { NotificationBell } from '@/components/notification-bell';
import { requireAuth } from '@/features/auth/server/requireAuth';
import { CalendarScreen } from '@/features/calendar/components/calendar-screen';
import { getCalendarMonth } from '@/features/calendar/server/services';
import { getMemoList } from '@/features/memo/server/services';
import { getPlanTypeCardList } from '@/features/plan-reminder/server/services';
import { getEffectivePairMode } from '@/lib/server/pair/mode';
import { todayJst, toYearMonthJst } from '@/lib/shared/domain/date';

// カレンダー（ホーム）。
// 予定シートをこの画面の上に出すので、その候補（予定カテゴリ）もここで取る。
// 記録の候補は入力モーダルを持つ (private)/layout.tsx 側で取る。

export default async function CalendarPage() {
  const session = await requireAuth();
  const today = todayJst();
  const yearMonth = toYearMonthJst(new Date());

  const [month, memos, isPair, planTypeList] = await Promise.all([
    getCalendarMonth(session, yearMonth),
    getMemoList(session),
    getEffectivePairMode(session),
    getPlanTypeCardList(session)
  ]);

  return (
    <CalendarScreen
      headerLeft={<NotificationBell />}
      planTypeList={planTypeList}
      initial={{
        hasPair: session.pairId !== null,
        isPair,
        memos,
        month,
        today
      }}
    />
  );
}
