import { NotificationBell } from '@/components/notification-bell';
import { requireAuth } from '@/features/auth/server/requireAuth';
import { TrendScreen } from '@/features/summary/components/trend-screen';
import { buildPayIncomeBar } from '@/features/summary/domain/chart-data';
import {
  currentYear,
  currentYearMonth
} from '@/features/summary/domain/period';
import {
  getPayAndIncomeList,
  getTypeChips
} from '@/features/summary/server/services';
import { getEffectivePairMode } from '@/lib/server/pair/mode';

// この画面本体はまだセッション由来の取得を Suspense 境界へ落としていないため、
// サーバでブロックしてよい印を立てる（共通 layout の静的シェルは効いている）。
// 外すのは画面ごとの個別タスク。
export const instant = false;

// 集計 › 推移。今年の全体（収支）を Server で 1 度取り、年の移動と見方の切替は
// Client が Server Action で取り直す。
//
// カテゴリ別のチップは支出／収入とモードで顔ぶれが変わるので、4 象限のうち
// いまのモードの 2 つを渡す（切替のたびに取りに行かない）。

export default async function SummaryTrendPage() {
  const session = await requireAuth();
  const isPair = await getEffectivePairMode(session);
  const year = currentYear();

  const [items, chips] = await Promise.all([
    getPayAndIncomeList(session, {
      year,
      isPair,
      isIncludeInstead: !isPair
    }),
    getTypeChips(session)
  ]);

  return (
    <TrendScreen
      chips={{
        pay: isPair ? chips.pay.pair : chips.pay.self,
        income: isPair ? chips.income.pair : chips.income.self
      }}
      hasPair={session.pairId !== null}
      headerLeft={<NotificationBell />}
      initialData={buildPayIncomeBar(items, year)}
      initialMonth={Number(currentYearMonth().split('-')[1])}
      initialYear={year}
      isPair={isPair}
      key={isPair ? 'pair' : 'self'}
    />
  );
}
