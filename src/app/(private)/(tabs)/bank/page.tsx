import { NotificationBell } from '@/components/notification-bell';
import { requireAuth } from '@/features/auth/server/requireAuth';
import { BankScreen } from '@/features/bank/components/bank-screen';
import { getBankScreenData } from '@/features/bank/server/services';
import { todayJst } from '@/lib/shared/domain/date';

// 口座タブ。
//
// 総資産 1 本の推移を出すので、口座ごとの積み上げ用 chartPoints は使わない。
// tableRows（記録日ごとの残高・前行引き継ぎ済み）から合計を取り出して描く。

export default async function BankPage() {
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
