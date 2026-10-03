import { Suspense } from 'react';
import { NotificationBell } from '@/components/notification-bell';
import { requireAuth } from '@/features/auth/server/requireAuth';
import { BankScreen } from '@/features/bank/components/bank-screen';
import { getBankScreenData } from '@/features/bank/server/services';
import { getDemoReferenceDate } from '@/features/demo/server/date';

// この画面本体はまだセッション由来の取得を Suspense 境界へ落としていないため、
// サーバでブロックしてよい印を立てる（共通 layout の静的シェルは効いている）。
// 外すのは画面ごとの個別タスク。
export const instant = false;

// 口座タブ。

export default function BankPage() {
  return (
    <Suspense fallback={<div className='flex-1' />}>
      <BankPageContent />
    </Suspense>
  );
}

async function BankPageContent() {
  const session = await requireAuth();
  const { banks, tableRows } = await getBankScreenData(session);

  return (
    <BankScreen
      banks={banks}
      headerLeft={<NotificationBell />}
      tableRows={tableRows}
      today={await getDemoReferenceDate(session)}
    />
  );
}
