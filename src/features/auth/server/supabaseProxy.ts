import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';
import { publicEnv } from '@/lib/shared/env';

// Proxy 専用の Supabase クライアント。
// 他の lib/auth/* と異なり server-only を付けない。proxy ランタイム専用で、
// Node の Server Component/Action 用を弾く server-only とは実行コンテキストが違うため。
//
// Proxy は next/headers の cookies() を使えないので NextRequest/NextResponse 経由で
// sb-* Cookie を読み書きする。返す response を呼び出し側がそのまま返さないと、
// リフレッシュされたトークン Cookie がクライアントに届かない（@supabase/ssr の定石）。
//
// 【getUser() ではなく getClaims() を使う理由】getUser() は毎回 Supabase Auth API
// へ HTTP 往復するため、画面遷移ごとに proxy と RSC で計 2 回の往復が発生していた。
// getClaims() は非対称鍵（ECC P-256）なら WebCrypto でローカル検証するため往復が
// 消える。代償としてトークン失効の反映が exp（既定 1 時間）まで遅れる。
//
// 【Cookie リフレッシュは維持】getClaims() は期限間近のトークンを検証前に
// リフレッシュする。Server Component からは Cookie を書けないため、この
// 書き戻し経路は proxy に残す必要がある（だから proxy 自体は廃止しない）。
export async function getUserInProxy(request: NextRequest) {
  const response = NextResponse.next({ request });

  const supabase = createServerClient(
    publicEnv.supabaseUrl,
    publicEnv.supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        }
      }
    }
  );

  // 未ログイン時は data も error も null になりうるため data の有無で判定する。
  // proxy は粗いガードなので claims の中身は見ず、検証が通ったことだけを使う。
  const { data } = await supabase.auth.getClaims();

  return { claims: data?.claims ?? null, response };
}
