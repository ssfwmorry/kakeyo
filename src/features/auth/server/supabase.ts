import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { publicEnv } from '@/lib/shared/env';

// Supabase Auth のサーバクライアント。
// Cookie の読み書きは next/headers の cookies() に委譲する。
// ユーザの真偽の源は auth.getClaims()（非対称鍵の JWT をローカル署名検証）であり、
// Cookie の中身をそのまま信用しない。
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        // Server Component からの set は cookies() が読み取り専用のため例外になる。
        // その場合トークンのリフレッシュは Proxy 側に委ねる（ここでは握り潰す）。
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {}
      }
    }
  });
}
