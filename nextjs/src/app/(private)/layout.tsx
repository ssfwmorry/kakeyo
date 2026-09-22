import type { ReactNode } from 'react';
import { requireAuth } from '@/features/auth/server/requireAuth';
import { BottomNav } from '@/features/layout/components/bottom-nav';
import { PairModeSwitch } from '@/features/layout/components/pair-mode-switch';
import { ReminderBell } from '@/features/layout/components/reminder-bell';
import type { ReminderItem } from '@/features/plan-reminder';
import { getReminderList } from '@/features/plan-reminder/server/services';
import { getPairMode } from '@/lib/server/pair/mode';
import { todayJst } from '@/lib/shared/domain/date';
import type { SessionData } from '@/lib/shared/types/auth';

// 認証必須画面の共有 layout（P5 で共通レイアウトを統合）。
// - 認証ガード（requireAuth。Proxy に加えた多層防御）
// - 上部バー: リマインダー通知ベル + ペア切替スイッチ（表示条件は各 Client 側）
// - 下部: 共通ボトムナビ（固定）
// 各画面（page.tsx）はこの shell の内側に描画され、shell には触れない。

export default async function PrivateLayout({
  children
}: {
  children: ReactNode;
}) {
  const session = await requireAuth();

  // ペアの有無（isExistPair）と共有モードのトグル状態を SSR で解決してスイッチへ渡す。
  const isExistPair = session.pairId !== null;
  const isPair = await getPairMode();

  // 期日を過ぎたリマインダーだけを SSR 側で抽出して通知ベルへ渡す（旧
  // AppBarNotification の count 相当）。今日の起点は date.ts の todayJst に一本化。
  const dueReminders = await getDueReminders(session);

  return (
    <div className='flex min-h-full flex-1 flex-col'>
      <header className='sticky top-0 z-40 flex h-12 items-center justify-between gap-2 border-b bg-background px-4'>
        <ReminderBell dueReminders={dueReminders} />
        <PairModeSwitch isExistPair={isExistPair} isPair={isPair} />
      </header>
      {/* ボトムナビの高さ分だけ下部に余白を確保する。 */}
      <main className='flex flex-1 flex-col pb-20'>{children}</main>
      <BottomNav />
    </div>
  );
}

// 期日超過（date <= 今日）のリマインダーを返す。振り分け済み all を対象に判定する。
// session は呼び出し側（既に requireAuth 済み）から受け取る（認証の二重解決を避ける）。
async function getDueReminders(session: SessionData): Promise<ReminderItem[]> {
  const { all } = await getReminderList(session);
  const today = todayJst();
  return all.filter((reminder) => reminder.date <= today);
}
