import { requireAuth } from '@/features/auth/server/requireAuth';
import { CalendarScreen } from '@/features/calendar';
import { getCalendarMonth } from '@/features/calendar/server/services';
import {
  getMemoList,
  getShortCutList
} from '@/features/memo-shortcut/server/services';
import { getPairMode } from '@/lib/server/pair/mode';
import { todayJst, toYearMonthJst } from '@/lib/shared/domain/date';

// カレンダー統合画面（ホーム / P5）の薄いルート（Server Component）。
// 認証 → 当月のカレンダーデータ（record/plan/reminder/月収支）・TODO・ショートカット・
// ペアモードを並行取得し、Client の CalendarScreen に渡すだけ。整形・状態は下位に委ねる。
// 月移動時の再取得は Client が calendar 所有の Server Action を呼ぶ（表示は純粋読み取り）。
export default async function CalendarPage() {
  const session = await requireAuth();
  const today = todayJst();
  const yearMonth = toYearMonthJst(new Date());

  const [month, memos, shortcuts, pairMode] = await Promise.all([
    getCalendarMonth(session, yearMonth),
    getMemoList(session),
    getShortCutList(session),
    getPairMode()
  ]);

  const hasPair = session.pairId !== null;

  return (
    <CalendarScreen
      initial={{
        month,
        memos,
        shortcuts,
        hasPair,
        // ペア未設定なら共有モードは常に false（個人スコープ固定）。
        isPair: hasPair && pairMode,
        today
      }}
    />
  );
}
