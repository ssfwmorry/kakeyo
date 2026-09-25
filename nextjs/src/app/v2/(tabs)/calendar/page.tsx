import { requireAuth } from '@/features/auth/server/requireAuth';
import { getCalendarMonth } from '@/features/calendar/server/services';
import {
  getMemoList,
  getShortCutList
} from '@/features/memo-shortcut/server/services';
import { getPlanTypeCardList } from '@/features/plan-reminder/server/services';
import {
  getMethodCardList,
  getTypeCardList
} from '@/features/type-method/server/services';
import { getEffectivePairMode } from '@/lib/server/pair/mode';
import { todayJst, toYearMonthJst } from '@/lib/shared/domain/date';
import { CalendarScreen } from '@/v2/features/calendar/components/calendar-screen';

// カレンダー（ホーム・新デザイン）。取得は旧画面と同じサービスをそのまま使う。
// 記録・予定のシートをこの画面の上に出すので、その候補（カテゴリ・方法・予定カテゴリ）も
// ここで取る。

export default async function V2CalendarPage() {
  const session = await requireAuth();
  const today = todayJst();
  const yearMonth = toYearMonthJst(new Date());

  const [month, memos, shortcuts, isPair, planTypeList, typeList, methodList] =
    await Promise.all([
      getCalendarMonth(session, yearMonth),
      getMemoList(session),
      getShortCutList(session),
      getEffectivePairMode(session),
      getPlanTypeCardList(session),
      getTypeCardList(session),
      getMethodCardList(session)
    ]);

  return (
    <CalendarScreen
      methodList={methodList}
      planTypeList={planTypeList}
      typeList={typeList}
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
