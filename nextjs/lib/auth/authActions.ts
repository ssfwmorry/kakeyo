import 'server-only';
import { createSupabaseServerClient } from './supabase';

// Supabase Auth 操作（凍結資産）。ログイン / パスワード再設定 / ログアウトの最小セット。
// 新規登録は現行 UI 非表示のため実装しない。
// 戻り値の error は Supabase の AuthError。呼び出し側（Server Action）で判定する。

// 成功時 Supabase が sb-* Cookie をセットする。
export async function signInWithPassword(email: string, password: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  return { user: data.user, error };
}

// パスワード再設定メールを送る。redirectTo は再設定画面（未実装のため任意）。
export async function sendResetPasswordEmail(
  email: string,
  redirectTo?: string
) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo
  });
  return { error };
}

// ログアウト。sb-* Cookie を破棄する（pairId/isDemo は毎回サーバ導出のため別途破棄不要）。
export async function signOut() {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signOut();
  return { error };
}
