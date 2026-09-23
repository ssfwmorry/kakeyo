'use server';

import { requireAuth } from '@/features/auth/server/requireAuth';
import { setPairMode } from '@/lib/server/pair/mode';

// 共通レイアウトのペア切替スイッチから呼ぶ Server Action。
// setPairMode は Cookie 更新 + 再検証を行い、その画面のデータスコープを再 fetch させる。
// pathname はスイッチが現在地を渡す（再検証を今見ている画面に絞るため）。
// 認証必須（多層防御）。スイッチ操作＝スコープ変更のため未ログインには通さない。
export async function setPairModeAction(
  isPair: boolean,
  pathname: string
): Promise<void> {
  await requireAuth();
  await setPairMode(isPair, pathname);
}
