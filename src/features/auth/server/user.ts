import 'server-only';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/server/db/client';
import { users } from '@/lib/server/db/schema';

// Supabase Auth の UID(UUID) から、アプリ内部で全 FK のキーとなる uid を解決する。
// users.supabase_user_uid に UID を紐付けたユーザのみログインできる。

export type AuthenticatedUser = {
  // 全 FK・scope のキーとなる uid。
  uid: string;
};

export async function findUserBySupabaseUid(
  supabaseUserUid: string
): Promise<AuthenticatedUser | null> {
  const [user] = await db
    .select({ uid: users.uid })
    .from(users)
    .where(eq(users.supabaseUserUid, supabaseUserUid))
    .limit(1);
  return user ?? null;
}
