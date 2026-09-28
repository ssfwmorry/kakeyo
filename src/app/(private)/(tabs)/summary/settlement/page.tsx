import { redirect } from 'next/navigation';
import { NotificationBell } from '@/components/notification-bell';
import { requireAuth } from '@/features/auth/server/requireAuth';
import {
  getPairedRecords,
  getPairPartnerName
} from '@/features/record/server/services';
import { SettlementScreen } from '@/features/summary/components/settlement-screen';
import { currentYearMonth } from '@/features/summary/domain/period';
import { getMethodCardList } from '@/features/summary/server/services';

// 集計 › 精算。ペアがいるときだけ。今月のペアの record を Server で 1 度取り、
// 月移動は Client が Server Action で取り直す。
//
// 「個人｜共有」のモードには依らない（精算はペア固有）。ペア未設定なら内訳へ戻す。

export default async function SummarySettlementPage() {
  const session = await requireAuth();
  if (session.pairId === null) {
    redirect('/summary');
  }
  const yearMonth = currentYearMonth();

  const [records, methods, partnerName] = await Promise.all([
    getPairedRecords(session, yearMonth),
    getMethodCardList(session),
    getPairPartnerName(session)
  ]);

  return (
    <SettlementScreen
      headerLeft={<NotificationBell />}
      initialRecords={records}
      initialYearMonth={yearMonth}
      // 精算方法はペア共有の方法マスタにだけある。
      methods={methods.both.pair}
      partnerName={partnerName}
    />
  );
}
