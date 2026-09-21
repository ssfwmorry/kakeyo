import 'server-only';
import { prisma } from '@/lib/db/client';

// Supabase Auth の UID(UUID) から、アプリ内部で全 FK のキーとなる Firebase uid を
// 解決する（凍結資産）。Firebase→Supabase Auth 移行の突合点。
// users.supabase_user_uid に UID を紐付けたユーザのみログインできる。

export type AuthenticatedUser = {
  // 全 FK・scope のキーとなる既存の uid（旧 Firebase UID）。
  uid: string;
};

export async function findUserBySupabaseUid(
  supabaseUserUid: string
): Promise<AuthenticatedUser | null> {
  const user = await prisma.user.findUnique({
    where: { supabaseUserUid },
    select: { uid: true }
  });
  return user;
}
