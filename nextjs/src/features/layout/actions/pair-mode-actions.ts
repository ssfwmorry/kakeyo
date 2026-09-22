'use server';

import { requireAuth } from '@/features/auth/server/requireAuth';
import { setPairMode } from '@/lib/server/pair/mode';

// 共通レイアウトのペア切替スイッチから呼ぶ Server Action。
// setPairMode（凍結資産）は Cookie 更新 + layout 再検証を行い、全画面のデータ
// スコープを再 fetch させる。
// 認証必須（多層防御）。スイッチ操作＝スコープ変更のため未ログインには通さない。
export async function setPairModeAction(isPair: boolean): Promise<void> {
  await requireAuth();
  await setPairMode(isPair);
}
