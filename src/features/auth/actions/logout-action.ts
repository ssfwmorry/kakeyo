'use server';

import { redirect } from 'next/navigation';
import { signOut } from '@/features/auth/server/authActions';
import { clearDemoSession } from '@/features/auth/server/demoCookie';
import { authRoutes } from '@/features/auth/shared/routes';

// 設定「その他」タブのログアウト Server Action。
// エラーでも遷移先で再度ガードされるため、ここでは常に login へ送る。
export async function logoutAction(): Promise<void> {
  await Promise.all([signOut(), clearDemoSession()]);
  redirect(authRoutes.login);
}
