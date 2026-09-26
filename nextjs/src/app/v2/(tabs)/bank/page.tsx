import { requireAuth } from '@/features/auth/server/requireAuth';
import { getBankScreenData } from '@/features/bank/server/services';
import { todayJst } from '@/lib/shared/domain/date';
import { NotificationBell } from '@/v2/components/notification-bell';
import { BankScreen } from '@/v2/features/bank/components/bank-screen';

// 口座（新デザイン）。
//
// 新デザインは総資産 1 本の推移を出すので、口座ごとの積み上げ用 chartPoints は使わない。
// tableRows（記録日ごとの残高・前行引き継ぎ済み）から合計を取り出して描く。

export default async function V2BankPage() {
  const session = await requireAuth();
  const { banks, tableRows } = await getBankScreenData(session);

  return (
    <BankScreen
      banks={banks}
      headerLeft={<NotificationBell />}
      tableRows={tableRows}
      today={todayJst()}
    />
  );
}
