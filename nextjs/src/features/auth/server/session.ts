import 'server-only';
import { cache } from 'react';
import { serverEnv } from '@/lib/server/env.server';
import type { SessionData } from '@/lib/shared/types/auth';
import { getPairId } from './pair';
import { createSupabaseServerClient } from './supabase';
import { findUserBySupabaseUid } from './user';

// セッションの取得（凍結資産）。
//
// 【設計の要】認証（誰か）も認可の鍵（pairId）もすべてサーバ側の真偽源から導出し、
// クライアント Cookie の値は信用しない。
// - userUid : Supabase UID(UUID) を users.supabase_user_uid で突合し、全 FK のキーで
//             ある既存 uid(旧 Firebase UID) に変換する（Firebase→Supabase Auth 移行）
// - email   : getUser()（Supabase サーバ検証済み）
// - pairId  : userUid(=Firebase uid) から毎回 DB 照会（getPairId）
// - isDemo  : email がデモ用資格情報と一致するか
//
// pairId/isDemo を署名 Cookie に載せる案は、署名では防げない「別ユーザの Cookie
// 残存による帰属ずれ（A の pairId が B のセッションに引きずられ他ペア露出）」の
// ため不採用。pair は 1 ユーザ 1 件と軽量で毎回照会しても実害はない。

// 多層防御方針（各 Server Component / Server Action の先頭で毎回呼ぶ）のため、
// React cache() で per-request メモ化し、1 レンダリング内の重複 I/O
// （getUser() 検証往復 + DB 2 クエリ）を 1 回に畳む。
export const getSessionData = cache(async (): Promise<SessionData | null> => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return null;
  }

  // Supabase Auth にはいるが users への紐付けが無いユーザはログインさせない。
  const appUser = await findUserBySupabaseUid(user.id);
  if (!appUser) {
    return null;
  }

  const pairId = await getPairId(appUser.uid);

  return {
    userUid: appUser.uid,
    email: user.email,
    pairId,
    isDemo: isDemoEmail(user.email)
  };
});

// デモユーザか否かは Supabase 認証済み email から一意に決まる。
// 資格情報が未設定（デモ無効環境）なら常に false。
function isDemoEmail(email: string): boolean {
  const demoEmail = serverEnv.demoUserEmail;
  if (!demoEmail) {
    return false;
  }
  return email.toLowerCase() === demoEmail.toLowerCase();
}
