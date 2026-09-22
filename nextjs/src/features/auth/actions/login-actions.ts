'use server';

import { parseWithZod } from '@conform-to/zod/v4';
import { redirect } from 'next/navigation';
import { serverEnv } from '@/lib/server/env.server';
import {
  type FormActionResult,
  ToastType
} from '@/lib/shared/types/formResult';
import { authLabels } from '../labels';
import { loginSchema, resetPasswordSchema } from '../schemas/login-schema';
import {
  sendResetPasswordEmail,
  signInWithPassword
} from '../server/authActions';
import { authRoutes } from '../shared/routes';

const { toast } = authLabels;

// login 画面の Server Actions（Conform + Zod、通知はトースト）。
// 戻り値は FormActionResult（submission=field 検証 / toast=成否通知）。
// クライアントは useForm(submission) でフィールドエラーを、useFormToast(result)
// でトーストを自動処理する。pairId / isDemo は getSessionData がサーバ側で毎回
// 導出するため、ログイン成功時に Cookie 書き込みは不要（成功したら遷移するだけ）。

// 通常ログイン。形式エラーは field 表示、認証失敗はメール存在秘匿のためトーストのみ。
export async function loginAction(
  _prev: FormActionResult | null,
  formData: FormData
): Promise<FormActionResult> {
  const submission = parseWithZod(formData, { schema: loginSchema });
  if (submission.status !== 'success') {
    return { submission: submission.reply() };
  }

  const { email, password } = submission.value;
  const { user, error } = await signInWithPassword(email, password);
  if (error || !user) {
    return {
      submission: submission.reply(),
      toast: {
        type: ToastType.error,
        message: toast.loginFailed
      }
    };
  }

  redirect(authRoutes.afterLogin);
}

// パスワード再設定メールの送信。メール存在を秘匿するため送信可否に関わらず成功扱い。
export async function resetPasswordAction(
  _prev: FormActionResult | null,
  formData: FormData
): Promise<FormActionResult> {
  const submission = parseWithZod(formData, { schema: resetPasswordSchema });
  if (submission.status !== 'success') {
    return { submission: submission.reply() };
  }

  const { error } = await sendResetPasswordEmail(submission.value.email);
  if (error) {
    return {
      submission: submission.reply(),
      toast: { type: ToastType.error, message: toast.resetSendFailed }
    };
  }
  return {
    submission: submission.reply(),
    toast: {
      type: ToastType.success,
      message: toast.resetSent
    }
  };
}

// デモログイン。フォーム入力を持たないため env の資格情報で直接ログインする。
// isDemo 判定は getSessionData が email で行う。失敗はトーストで通知。
export async function demoLoginAction(): Promise<FormActionResult> {
  const { demoUserEmail, demoUserPassword } = serverEnv;
  if (!demoUserEmail || !demoUserPassword) {
    return {
      toast: {
        type: ToastType.error,
        message: toast.demoUnavailable
      }
    };
  }

  const { user, error } = await signInWithPassword(
    demoUserEmail,
    demoUserPassword
  );
  if (error || !user) {
    return {
      toast: { type: ToastType.error, message: toast.demoFailed }
    };
  }

  redirect(authRoutes.afterLogin);
}
