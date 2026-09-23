'use client';

import { getFormProps, useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod/v4';
import Link from 'next/link';
import { useState } from 'react';
import { FormField } from '@/components/form/form-field';
import { SubmitButton } from '@/components/form/submit-button';
import { useFormAction } from '@/components/form/use-form-action';
import { IconOpenInNew } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DemoMode } from '@/features/demo';
import { L } from '@/lib/shared/labels';
import {
  demoLoginAction,
  loginAction,
  resetPasswordAction
} from '../actions/login-actions';
import { authLabels, TUTORIAL_URL } from '../labels';
import { loginSchema, resetPasswordSchema } from '../schemas/login-schema';

const { appName, field, action, demo } = authLabels;

// login / reset / demo をそれぞれ独立したフォーム・アクションとして扱う。
// 新規登録は UI 非表示のため置かない。
//
// フォームは白カードに収め、パスワード再設定は常時表示ではなく
// ボタンで切り替わる別モードにする（常設だと画面が雑多になる）。
// パスワード欄には表示/伏字トグルを出す（入力ミスの確認手段）。
//
// デモは「デモページを見る」→ 同じ画面内でアカウント種別（ペアあり / ペアなし）を選ぶ
// 2 段階。別ページへ遷移せず、選択カードをカードの下に出し分ける。

export function LoginForm() {
  // 'login' = 通常ログイン / 'reset' = パスワード再設定。
  const [mode, setMode] = useState<'login' | 'reset'>('login');
  const [isSelectingDemo, setIsSelectingDemo] = useState(false);

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

  const [, demoPairLogin, isDemoPairLoggingIn] = useFormAction(() =>
    demoLoginAction(DemoMode.pair)
  );
  const [, demoSoloLogin, isDemoSoloLoggingIn] = useFormAction(() =>
    demoLoginAction(DemoMode.solo)
  );

  return (
    <div className='flex w-full max-w-sm flex-col gap-6'>
      <Card>
        <CardHeader>
          <CardTitle className='text-center text-xl'>{appName}</CardTitle>
        </CardHeader>
        <CardContent className='flex flex-col gap-4'>
          {mode === 'login' ? (
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
                revealable
              />
              <SubmitButton isPending={isLoggingIn}>
                {action.login}
              </SubmitButton>
            </form>
          ) : (
            <form
              {...getFormProps(resetForm)}
              action={reset}
              className='flex flex-col gap-4'
            >
              <FormField
                label={field.resetPassword}
                field={resetFields.email}
                type='email'
                autoComplete='email'
              />
              <SubmitButton isPending={isResetting}>
                {action.sendReset}
              </SubmitButton>
            </form>
          )}

          {/* モード切替（再設定へ / ログインへ戻る）。 */}
          <div className='flex justify-center'>
            <Button
              type='button'
              variant='link'
              size='sm'
              onClick={() => setMode(mode === 'login' ? 'reset' : 'login')}
            >
              {mode === 'login' ? action.showReset : L.button.cancel}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* デモ／とりせつはカードの外に横並びで置く。 */}
      <div className='flex gap-3'>
        <Button
          type='button'
          variant='outline'
          className='flex-1'
          onClick={() => setIsSelectingDemo(true)}
        >
          {action.demo}
        </Button>
        <a
          href={TUTORIAL_URL}
          target='_blank'
          rel='noopener noreferrer'
          className='flex flex-1 items-center justify-center gap-1 rounded-md border px-3 py-2 text-sm'
        >
          {action.tutorial}
          <IconOpenInNew className='size-3.5' />
        </a>
      </div>

      {isSelectingDemo ? (
        <Card>
          <CardHeader>
            <CardTitle className='text-center text-base'>
              {demo.selectTitle}
            </CardTitle>
          </CardHeader>
          <CardContent className='flex flex-col gap-3'>
            <p className='text-center text-muted-foreground text-xs'>
              {demo.selectHint}
            </p>
            <form action={demoPairLogin}>
              <SubmitButton
                isPending={isDemoPairLoggingIn}
                variant='outline'
                className='w-full'
              >
                {demo.pair}
              </SubmitButton>
            </form>
            <form action={demoSoloLogin}>
              <SubmitButton
                isPending={isDemoSoloLoggingIn}
                variant='outline'
                className='w-full'
              >
                {demo.solo}
              </SubmitButton>
            </form>
            <div className='flex justify-center'>
              <Button
                type='button'
                variant='link'
                size='sm'
                onClick={() => setIsSelectingDemo(false)}
              >
                {L.button.cancel}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className='flex justify-center'>
        {/* 問い合わせ導線（未ログインでも到達可）。 */}
        <Link
          href='/inquiry'
          className='text-muted-foreground text-sm underline'
        >
          {action.inquiry}
        </Link>
      </div>
    </div>
  );
}
