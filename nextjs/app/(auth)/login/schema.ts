import { z } from 'zod';

// login フォームの入力スキーマ（Conform + Zod）。
// ここは「形式」の検証に留める。認証可否（メール/パスワード不一致）は field 単位で
// 出すと存在の秘匿が崩れるため、Server Action がフォーム全体エラーとして返す。

export const loginSchema = z.object({
  email: z.email('メールアドレスの形式が正しくありません'),
  password: z.string().min(1, 'パスワードを入力してください')
});

// パスワード再設定は email だけ必要（同じフォームの email 欄を流用）。
export const resetPasswordSchema = z.object({
  email: z.email('メールアドレスの形式が正しくありません')
});
