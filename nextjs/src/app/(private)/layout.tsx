import type { ReactNode } from 'react';
import { requireAuth } from '@/features/auth/server/requireAuth';
import { BottomNav } from '@/features/layout/components/bottom-nav';
import { PairModeSwitch } from '@/features/layout/components/pair-mode-switch';
import { ReminderBellSlot } from '@/features/layout/components/reminder-bell-slot';
import { OfflineBanner } from '@/features/pwa/components/offline-banner';
import { getPairMode } from '@/lib/server/pair/mode';

// 認証必須画面の共有 layout。
// - 認証ガード（requireAuth。Proxy に加えた多層防御）
// - 上部バー: リマインダー通知ベル + ペア切替スイッチ（表示条件は各 Client 側）
// - 下部: 共通ボトムナビ（固定）
// 各画面（page.tsx）はこの shell の内側に描画され、shell には触れない。
//
// リマインダー取得は ReminderBellSlot 内の Suspense 境界に隔離している。
// ここで await するとベルのためだけの DB 往復が全画面のクリティカルパスに
// 入るため、layout では待たない（詳細は reminder-bell-slot.tsx）。

export default async function PrivateLayout({
  children
}: {
  children: ReactNode;
}) {
  const session = await requireAuth();

  // ペアの有無（isExistPair）と共有モードのトグル状態を SSR で解決してスイッチへ渡す。
  const isExistPair = session.pairId !== null;
  const isPair = await getPairMode();

  return (
    // 画面ぴったりの縦フレックス（h-dvh）。これで main が「上部バーとボトムナビを
    // 除いた残り」という確定した高さを持ち、カレンダー画面が h-full で 1 画面に収まる。
    // 中身が長い画面は main 側が overflow-y-auto でスクロールする。
    <div className='flex h-dvh flex-col'>
      {/* オフライン告知。h-dvh の縦フレックスの一員として header の上に積む
          （ラッパーで囲むと main へ渡る高さの連鎖が変わるため囲まない）。
          非表示時は null を返すので通常時のレイアウトには影響しない。 */}
      <OfflineBanner />
      <header className='sticky top-0 z-40 flex h-12 items-center justify-between gap-2 border-b bg-background px-4'>
        <ReminderBellSlot />
        <div className='flex items-center gap-2'>
          {/* デモログイン中の視覚的手がかり。 */}
          {session.isDemo ? (
            <span className='rounded bg-red-600 px-2 py-0.5 font-bold text-white text-xs'>
              デモ用
            </span>
          ) : null}
          <PairModeSwitch isExistPair={isExistPair} isPair={isPair} />
        </div>
      </header>
      {/* 上部バーとボトムナビを除いた残りが main の高さ。min-h-0 が無いと中身の
          高さで膨らみ flex-1 が頭打ちにならない。 */}
      <main className='flex min-h-0 flex-1 flex-col overflow-y-auto'>
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
