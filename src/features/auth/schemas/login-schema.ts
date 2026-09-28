import { z } from 'zod';
import { authLabels } from '../labels';

// login フォームの入力スキーマ（Conform + Zod）。
// ここは「形式」の検証に留める。認証可否（メール/パスワード不一致）は field 単位で
// 出すと存在の秘匿が崩れるため、Server Action がフォーム全体エラーとして返す。

const { validation } = authLabels;

export const loginSchema = z.object({
  email: z.email(validation.emailFormat),
  password: z.string().min(1, validation.passwordRequired)
});

// パスワード再設定は email だけ必要（同じフォームの email 欄を流用）。
export const resetPasswordSchema = z.object({
  email: z.email(validation.emailFormat)
});
