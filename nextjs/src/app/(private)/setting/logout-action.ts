'use server';

import { redirect } from 'next/navigation';
import { signOut } from '@/features/auth/server/authActions';
import { authRoutes } from '@/features/auth/shared/routes';

// 設定「その他」タブのログアウト Server Action。
// signOut（凍結資産・authActions）で sb-* Cookie を破棄し、login へ遷移する
// （fe-screens §SETTING の General: ログアウト → login）。
// エラーでも遷移先で再度ガードされるため、ここでは常に login へ送る。
export async function logoutAction(): Promise<void> {
  await signOut();
  redirect(authRoutes.login);
}
