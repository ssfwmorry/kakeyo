import Link from 'next/link';
import { Suspense } from 'react';
import { IconBell } from '@/components/icons';
import { requireAuth } from '@/features/auth/server/requireAuth';
import { getReminderList } from '@/features/plan-reminder/server/services';
import { todayJst } from '@/lib/shared/domain/date';

// 期日超過の件数バッジ付きベル。
//
// 既存の ReminderBellSlot と同じく Suspense 境界に隔離する。リマインダー取得は
// ベルだけが必要とする I/O で、画面本体の描画を待たせる理由がないため。
//
// 新デザインではベルを押すとお知らせの一覧（下から出るシート）を開く想定だが、
// シート部品は T2 で作る。それまではリマインダー設定画面へ遷移させておく。

export function NotificationBellSlot() {
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
      <IconBell className='size-5.5' />
    </span>
  );
}

async function BellContent() {
  const session = await requireAuth();
  const { all } = await getReminderList(session);
  const today = todayJst();
  const dueCount = all.filter((reminder) => reminder.date <= today).length;

  return (
    <Link
      aria-label={dueCount === 0 ? 'お知らせ' : `お知らせ ${dueCount}件`}
      className='-ml-2.5 relative flex size-11 items-center justify-center text-foreground'
      href='/v2/setting/reminder'
    >
      <IconBell aria-hidden='true' className='size-5.5' />
      {dueCount > 0 ? (
        <span className='absolute top-1.5 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-lg bg-destructive px-1 font-bold text-[10px] text-destructive-foreground'>
          {dueCount}
        </span>
      ) : null}
    </Link>
  );
}
