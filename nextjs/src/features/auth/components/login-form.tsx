'use client';

import { getFormProps, useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod/v4';
import Link from 'next/link';
import { FormField } from '@/components/form/form-field';
import { useFormAction } from '@/components/form/use-form-action';
import { Button } from '@/components/ui/button';
import {
  demoLoginAction,
  loginAction,
  resetPasswordAction
} from '../actions/login-actions';
import { authLabels, TUTORIAL_URL } from '../labels';
import { loginSchema, resetPasswordSchema } from '../schemas/login-schema';

const { appName, field, action } = authLabels;

// login / reset / demo をそれぞれ独立したフォーム・アクションとして扱う。
// 新規登録は UI 非表示のため置かない。

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
      <h1 className='text-2xl font-semibold'>{appName}</h1>

      <form
        {...getFormProps(loginForm)}
        action={login}
        className='flex flex-col gap-4'
      >
        <FormField
          label={field.email}
          field={loginFields.email}
          type='email'
          autoComplete='email'
        />
        <FormField
          label={field.password}
          field={loginFields.password}
          type='password'
          autoComplete='current-password'
        />
        <Button type='submit' disabled={isLoggingIn}>
          {action.login}
        </Button>
      </form>

      <form
        {...getFormProps(resetForm)}
        action={reset}
        className='flex flex-col gap-2'
      >
        <FormField
          label={field.resetPassword}
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
          {action.sendReset}
        </Button>
      </form>

      <form action={demoLogin}>
        <Button
          type='submit'
          variant='outline'
          className='w-full'
          disabled={isDemoLoggingIn}
        >
          {action.demo}
        </Button>
      </form>

      <div className='flex flex-col items-center gap-2'>
        {/* 問い合わせ導線（未ログインでも到達可）。 */}
        <Link
          href='/inquiry'
          className='text-muted-foreground text-sm underline'
        >
          {action.inquiry}
        </Link>
        {/* 使い方（とりせつ）への外部リンク。 */}
        <a
          href={TUTORIAL_URL}
          target='_blank'
          rel='noopener noreferrer'
          className='text-muted-foreground text-sm underline'
        >
          {action.tutorial}
        </a>
      </div>
    </div>
  );
}
