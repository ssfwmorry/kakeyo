'use client';

import { getFormProps, useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod/v4';
import { FormField } from '@/components/form/form-field';
import { useFormAction } from '@/components/form/use-form-action';
import { Button } from '@/components/ui/button';
import { demoLoginAction, loginAction, resetPasswordAction } from './actions';
import { loginSchema, resetPasswordSchema } from './schema';

// login フォーム（Conform + Zod、通知はトースト）。
// login / reset / demo をそれぞれ独立したフォーム・アクションとして扱う
// （1 フォーム = 1 スキーマ = 1 useForm）。新規登録は現行 UI 非表示のため置かない。
// 成否通知は useFormAction（useActionState + useFormToast）が action 結果の
// toast を受けて自動発火する（購読宣言をフォームごとに書かない）。

export function LoginForm() {
  const [loginResult, login, isLoggingIn] = useFormAction(loginAction);
  const [loginForm, loginFields] = useForm({
    lastResult: loginResult?.submission,
    onValidate: ({ formData }) =>
      parseWithZod(formData, { schema: loginSchema })
  });

  const [resetResult, reset, isResetting] = useFormAction(resetPasswordAction);
  const [resetForm, resetFields] = useForm({
    lastResult: resetResult?.submission,
    onValidate: ({ formData }) =>
      parseWithZod(formData, { schema: resetPasswordSchema })
  });

  const [, demoLogin, isDemoLoggingIn] = useFormAction(() => demoLoginAction());

  return (
    <div className='flex w-full max-w-sm flex-col gap-8'>
      <h1 className='text-2xl font-semibold'>かけよ</h1>

      <form
        {...getFormProps(loginForm)}
        action={login}
        className='flex flex-col gap-4'
      >
        <FormField
          label='メールアドレス'
          field={loginFields.email}
          type='email'
          autoComplete='email'
        />
        <FormField
          label='パスワード'
          field={loginFields.password}
          type='password'
          autoComplete='current-password'
        />
        <Button type='submit' disabled={isLoggingIn}>
          ログイン
        </Button>
      </form>

      <form
        {...getFormProps(resetForm)}
        action={reset}
        className='flex flex-col gap-2'
      >
        <FormField
          label='パスワード再設定（登録メール宛に送信）'
          field={resetFields.email}
          type='email'
          autoComplete='email'
        />
        <Button
          type='submit'
          variant='link'
          className='px-0'
          disabled={isResetting}
        >
          再設定メールを送る
        </Button>
      </form>

      <form action={demoLogin}>
        <Button
          type='submit'
          variant='outline'
          className='w-full'
          disabled={isDemoLoggingIn}
        >
          デモページを見る
        </Button>
      </form>
    </div>
  );
}
