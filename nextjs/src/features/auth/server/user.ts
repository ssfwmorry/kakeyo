import 'server-only';
import { prisma } from '@/lib/server/db/client';

// Supabase Auth の UID(UUID) から、アプリ内部で全 FK のキーとなる uid を解決する。
// users.supabase_user_uid に UID を紐付けたユーザのみログインできる。

export type AuthenticatedUser = {
  // 全 FK・scope のキーとなる uid。
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
