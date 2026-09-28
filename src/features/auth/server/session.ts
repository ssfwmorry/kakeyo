import 'server-only';
import { cache } from 'react';
import type { SessionData } from '@/lib/shared/types/auth';
import { readDemoMode, toDemoSessionData } from './demoCookie';
import { getPairId } from './pair';
import { createSupabaseServerClient } from './supabase';
import { findUserBySupabaseUid } from './user';

// セッションの取得。
//
// 【設計の要】認証（誰か）も認可の鍵（pairId）もすべてサーバ側の真偽源から導出し、
// クライアント Cookie の値は信用しない。
// - userUid : Supabase UID(UUID) を users.supabase_user_uid で突合し、全 FK のキーで
//             ある既存 uid に変換する
// - email   : getClaims()（署名検証済み JWT のクレーム）
// - pairId  : userUid から毎回 DB 照会（getPairId）
// - isDemo  : 署名付きデモ Cookie の有無（demoCookie.ts）
//
// 【デモ】先頭でデモ Cookie を検証し、有効なら固定 SessionData を早期 return する
// （userUid / pairId は mode から一意に決まり、Supabase 往復も DB 照会も 0 回）。
// pairId/isDemo を通常ユーザの署名 Cookie に載せる案は、署名では防げない「別ユーザの Cookie
// 残存による帰属ずれ（A の pairId が B のセッションに引きずられ他ペア露出）」の
// ため不採用。pair は 1 ユーザ 1 件と軽量で毎回照会しても実害はない。
//
// 【getUser() ではなく getClaims() を使う理由】
// getUser() は毎回 Supabase Auth API へ HTTP 往復する。本アプリは画面遷移ごとに
// RSC が再実行されるため、この往復がモバイル回線で体感遅延に直結していた。
// getClaims() は非対称署名鍵（ECC P-256）なら WebCrypto でローカル検証するため
// 往復が消える（JWKS は初回のみ取得しキャッシュされる）。
//
// 【トレードオフ】ローカル検証はトークン失効（ログアウト/BAN）を即座に反映しない。
// アクセストークンの exp（既定 1 時間）までは有効なままとなる。ペア家計簿の
// 性質上この遅延は許容と判断した（ユーザ自身とそのペアのみが参照範囲）。
// 即時失効が必要な要件が出たら getUser() へ戻すこと。
//
// 【重要】Supabase の JWT 署名鍵が Legacy HS256（対称鍵）のままだと、getClaims()
// は内部でサーバ検証にフォールバックし往復は消えない。ダッシュボードの
// Settings > JWT Keys で ECC 鍵を CURRENT KEY に昇格（Rotate keys）させること。
//
// 多層防御方針（各 Server Component / Server Action の先頭で毎回呼ぶ）のため、
// React cache() で per-request メモ化し、1 レンダリング内の重複 I/O
// （JWT 検証 + DB 2 クエリ）を 1 回に畳む。
export const getSessionData = cache(async (): Promise<SessionData | null> => {
  const demoMode = await readDemoMode();
  if (demoMode) {
    return toDemoSessionData(demoMode);
  }

  const supabase = await createSupabaseServerClient();

  // getClaims() は「成功」「エラー」「セッション無し（data も error も null）」の
  // 3 状態を返すため、data の有無で判定する。
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data) {
    return null;
  }

  const { claims } = data;
  // email は Custom Access Token Hook で落とせるため型上 optional。
  // 欠けていればログイン不可として扱う。
  const email = claims.email;
  if (!email) {
    return null;
  }

  // Supabase Auth にはいるが users への紐付けが無いユーザはログインさせない。
  // sub が Supabase UID（getUser() の user.id と同じ値）。
  const appUser = await findUserBySupabaseUid(claims.sub);
  if (!appUser) {
    return null;
  }

  const pairId = await getPairId(appUser.uid);

  return {
    userUid: appUser.uid,
    email,
    pairId,
    isDemo: false
  };
});
