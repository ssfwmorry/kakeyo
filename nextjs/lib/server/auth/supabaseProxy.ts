import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';
import { publicEnv } from '@/lib/shared/env';

// Proxy 専用の Supabase クライアント（凍結資産）。
// 他の lib/auth/* と異なり server-only を付けない。proxy ランタイム専用で、
// Node の Server Component/Action 用を弾く server-only とは実行コンテキストが違うため。
//
// Proxy は next/headers の cookies() を使えないので NextRequest/NextResponse 経由で
// sb-* Cookie を読み書きする。返す response を呼び出し側がそのまま返さないと、
// リフレッシュされたトークン Cookie がクライアントに届かない（@supabase/ssr の定石）。
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

  const {
    data: { user }
  } = await supabase.auth.getUser();

  return { user, response };
}
