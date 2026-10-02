import { NotificationBell } from '@/components/notification-bell';
import { requireAuth } from '@/features/auth/server/requireAuth';
import { getDemoReferenceYearMonth } from '@/features/demo/server/date';
import { SummaryScreen } from '@/features/summary/components/summary-screen';
import { getTypePie } from '@/features/summary/server/services';
import { getEffectivePairMode } from '@/lib/server/pair/mode';

// この画面本体はまだセッション由来の取得を Suspense 境界へ落としていないため、
// サーバでブロックしてよい印を立てる（共通 layout の静的シェルは効いている）。
// 外すのは画面ごとの個別タスク。
export const instant = false;

// 集計。今月・支出のカテゴリ別内訳を Server で 1 度取り、
// 月移動と支出／収入の切替は Client が Server Action で取り直す。
//
// 立替の扱いは個人モードは立替込み、共有モードは含めない。
// 「個人｜共有」を切り替えるとスコープが変わるので、画面の state ごと作り直す（key）。

export default async function SummaryPage() {
  const session = await requireAuth();
  const isPair = await getEffectivePairMode(session);
  const yearMonth = await getDemoReferenceYearMonth(session);

  const initialData = await getTypePie(session, {
    isPay: true,
    isPair,
    isIncludeInstead: !isPair,
    yearMonth
  });

  return (
    <SummaryScreen
      hasPair={session.pairId !== null}
      headerLeft={<NotificationBell />}
      initialData={initialData}
      initialYearMonth={yearMonth}
      isPair={isPair}
      key={isPair ? 'pair' : 'self'}
    />
  );
}
