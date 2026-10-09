import { redirect } from 'next/navigation';
import { NotificationBell } from '@/components/notification-bell';
import { requireAuth } from '@/features/auth/server/requireAuth';
import { getDemoReferenceYearMonth } from '@/features/demo/server/date';
import {
  getPairedRecords,
  getPairUserNames
} from '@/features/record/server/services';
import { SettlementScreen } from '@/features/summary/components/settlement-screen';
import { getMethodCardList } from '@/features/summary/server/services';

// この画面本体はまだセッション由来の取得を Suspense 境界へ落としていないため、
// サーバでブロックしてよい印を立てる（共通 layout の静的シェルは効いている）。
// 外すのは画面ごとの個別タスク。
export const instant = false;

// 集計 › 精算。ペアがいるときだけ。今月のペアの record を Server で 1 度取り、
// 月移動は Client が Server Action で取り直す。
//
// 「個人｜共有」のモードには依らない（精算はペア固有）。ペア未設定なら内訳へ戻す。

export default async function SummarySettlementPage() {
  const session = await requireAuth();
  if (session.pairId === null) {
    redirect('/summary');
  }
  const yearMonth = await getDemoReferenceYearMonth(session);

  const [records, methods, userNames] = await Promise.all([
    getPairedRecords(session, yearMonth),
    getMethodCardList(session),
    getPairUserNames(session)
  ]);

  return (
    <SettlementScreen
      headerLeft={<NotificationBell />}
      initialRecords={records}
      initialYearMonth={yearMonth}
      // 精算方法はペア共有の方法マスタにだけある。
      methods={methods.both.pair}
      userNames={userNames}
    />
  );
}
