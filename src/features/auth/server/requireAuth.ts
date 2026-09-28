import 'server-only';
import { redirect } from 'next/navigation';
import { authRoutes } from '@/features/auth/shared/routes';
import type { SessionData } from '@/lib/shared/types/auth';
import { getSessionData } from './session';

// 認証ガード。Server Component / Server Action の先頭で呼ぶ。
// Proxy でも粗くガードするが、Server Function は Proxy を経由しない経路がありうる
// ため、データに触れる層でも本関数で認証を確認する（多層防御）。

// ログイン必須。未ログインなら redirect（この関数は戻らない）。
// 戻り値の SessionData は以降のリポジトリ呼び出しにそのまま渡せる。
export async function requireAuth(): Promise<SessionData> {
  const session = await getSessionData();
  if (!session) {
    redirect(authRoutes.login);
  }
  return session;
}
