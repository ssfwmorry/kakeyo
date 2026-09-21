import type { ReactNode } from 'react';
import { requireAuth } from '@/features/auth/server/requireAuth';

// 認証必須画面の共有 layout（凍結資産の骨組み）。ここでは認証ガードのみ。
// 共通レイアウト（ボトムナビ・ペア切替スイッチ・リマインダー通知）の統合は P5。
// 各ドメインエージェントはこの shell に触れず、自画面の中身に集中する。

export default async function PrivateLayout({
  children
}: {
  children: ReactNode;
}) {
  // Proxy に加えた多層防御。未ログインならここで /login へ。
  await requireAuth();

  return <div className='flex flex-1 flex-col'>{children}</div>;
}
