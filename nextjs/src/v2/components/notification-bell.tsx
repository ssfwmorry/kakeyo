import { Suspense } from 'react';
import { IconBell } from '@/components/icons';
import { requireAuth } from '@/features/auth/server/requireAuth';
import { getReminderList } from '@/features/plan-reminder/server/services';
import { todayJst } from '@/lib/shared/domain/date';
import { NotificationBellButton } from '@/v2/features/notify/components/notification-bell-button';
import { buildNotifyRows } from '@/v2/features/notify/domain/notify-rows';

// ヘッダー左のベル。期日を過ぎたリマインダーの件数を赤いバッジで出し、押すと
// お知らせシートが開く（原典 Calendar / Setting のヘッダーと Notify）。
//
// リマインダーの取得は Suspense 境界に隔離する。ベルだけが必要とする I/O で、
// 画面本体の描画を待たせる理由がないため。件数が 0 でもベルは出す（バッジ無し）。
//
// 「今日」はここ（サーバ）で確定し、行の計算まで済ませてから Client に渡す。

export function NotificationBell() {
  return (
    <Suspense fallback={<BellFallback />}>
      <BellContent />
    </Suspense>
  );
}

// ストリーミング到着までの見た目。件数は未確定なのでバッジを出さず、
// 同じ大きさのベルだけ置いてレイアウトシフトを防ぐ。
function BellFallback() {
  return (
    <span
      aria-hidden='true'
      className='-ml-2.5 flex size-11 items-center justify-center text-foreground'
    >
      <IconBell className='size-[22px]' strokeWidth={2} />
    </span>
  );
}

async function BellContent() {
  const session = await requireAuth();
  const { all } = await getReminderList(session);
  const rows = buildNotifyRows(all, todayJst());

  return <NotificationBellButton rows={rows} />;
}
