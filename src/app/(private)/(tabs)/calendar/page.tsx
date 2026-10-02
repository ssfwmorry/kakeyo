import { Suspense } from 'react';
import { NotificationBell } from '@/components/notification-bell';
import { requireAuth } from '@/features/auth/server/requireAuth';
import { CalendarScreen } from '@/features/calendar/components/calendar-screen';
import { getCalendarMonth } from '@/features/calendar/server/services';
import {
  getDemoReferenceDate,
  getDemoReferenceYearMonth
} from '@/features/demo/server/date';
import { getMemoList } from '@/features/memo/server/services';
import { getPlanTypeCardList } from '@/features/plan-reminder/server/services';
import { materializePlannedRecordsForMonth } from '@/features/planned-record/server/services';
import { getEffectivePairMode } from '@/lib/server/pair/mode';
import CalendarLoading from './loading';

// この画面本体はまだセッション由来の取得を Suspense 境界へ落としていないため、
// サーバでブロックしてよい印を立てる（共通 layout の静的シェルは効いている）。
// 外すのは画面ごとの個別タスク。
export const instant = false;

// カレンダー（ホーム）。
// 予定シートをこの画面の上に出すので、その候補（予定カテゴリ）もここで取る。
// 記録の候補は入力モーダルを持つ (private)/layout.tsx 側で取る。

export default function CalendarPage() {
  return (
    <Suspense fallback={<CalendarLoading />}>
      <CalendarPageContent />
    </Suspense>
  );
}

async function CalendarPageContent() {
  const session = await requireAuth();
  const today = getDemoReferenceDate(session);
  const yearMonth = getDemoReferenceYearMonth(session);

  await materializePlannedRecordsForMonth(session, yearMonth);

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
