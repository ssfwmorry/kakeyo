import { Suspense } from 'react';
import { IconBell } from '@/components/icons';
import { requireAuth } from '@/features/auth/server/requireAuth';
import type { ReminderItem } from '@/features/plan-reminder';
import { getReminderList } from '@/features/plan-reminder/server/services';
import { todayJst } from '@/lib/shared/domain/date';
import type { SessionData } from '@/lib/shared/types/auth';
import { ReminderBell } from './reminder-bell';

// 通知ベルの Suspense 境界。
//
// リマインダー取得は通知ベルだけが必要とする I/O だが、layout で await すると
// カレンダー・口座・設定などどの画面を開いても「取得が終わるまでページ本体が
// 出ない」状態になり、画面遷移ごとの体感遅延に直結していた。
// ベルを独立した Suspense 境界に切り出し、ページ本体の描画を待たせない
// （ベルの中身だけが遅れてストリーミングで差し込まれる）。
export function ReminderBellSlot() {
  return (
    <Suspense fallback={<ReminderBellFallback />}>
      <ReminderBellContent />
    </Suspense>
  );
}

// ストリーミング到着までの見た目。件数バッジは確定前なので出さず、
// ベルのアイコンだけ同じ位置・同じサイズで置いてレイアウトシフトを防ぐ。
function ReminderBellFallback() {
  return (
    <span
      className='relative flex items-center text-muted-foreground'
      aria-hidden='true'
    >
      <IconBell className='size-5' />
    </span>
  );
}

// 実データ取得。requireAuth は getSessionData が React cache() でメモ化されているため、
// layout 側の呼び出しと同一リクエスト内では重複 I/O にならない。
async function ReminderBellContent() {
  const session = await requireAuth();
  const dueReminders = await getDueReminders(session);
  return <ReminderBell dueReminders={dueReminders} />;
}

// 期日超過（date <= 今日）のリマインダーを返す。振り分け済み all を対象に判定する。
// 今日の起点は date.ts の todayJst に一本化。
async function getDueReminders(session: SessionData): Promise<ReminderItem[]> {
  const { all } = await getReminderList(session);
  const today = todayJst();
  return all.filter((reminder) => reminder.date <= today);
}
