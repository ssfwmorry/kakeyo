import { requireAuth } from '@/features/auth/server/requireAuth';
import { getCalendarMonth } from '@/features/calendar/server/services';
import { getMemoList } from '@/features/memo/server/services';
import { getPlanTypeCardList } from '@/features/plan-reminder/server/services';
import { getEffectivePairMode } from '@/lib/server/pair/mode';
import { todayJst, toYearMonthJst } from '@/lib/shared/domain/date';
import { NotificationBell } from '@/v2/components/notification-bell';
import { CalendarScreen } from '@/v2/features/calendar/components/calendar-screen';

// カレンダー（ホーム・新デザイン）。取得は旧画面と同じサービスをそのまま使う。
// 予定シートをこの画面の上に出すので、その候補（予定カテゴリ）もここで取る。
// 記録の候補は入力モーダルを持つ v2 layout 側で取る。

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
