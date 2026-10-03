'use client';

import { getFormProps, useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod/v4';
import Link from 'next/link';
import { useState } from 'react';
import { useFormAction } from '@/components/form/use-form-action';
import { IconMail, IconManual, IconOpenInNew } from '@/components/icons';
import { SheetSubmitButton } from '@/components/ui/sheet-submit-button';
import { loginAction, resetPasswordAction } from '../actions/login-actions';
import { authLabels, TUTORIAL_URL } from '../labels';
import { loginSchema, resetPasswordSchema } from '../schemas/login-schema';
import { DemoSelectSheet } from './demo-select-sheet';
import { LoginField } from './login-field';

const { appName, tagline, field, action, reset } = authLabels;

// ログイン画面。
//
// 上から「ワードマーク → 入力欄とログイン → デモ → とりせつ／お問い合わせ」の
// 1 列。入力欄と主ボタンはアプリ内のシートと同じ白い面・h52 の塗りで、
// ログインだけ別の見た目にしない。
//
// login / reset / demo はそれぞれ独立したフォーム・アクション。新規登録は UI に出さない。
// パスワード再設定は常設せず、ログイン欄と入れ替わりで出す（常設だと画面が雑多になる）。
// デモのアカウント選択はシートに切り出す（demo-select-sheet.tsx）。

export function LoginScreen() {
  // 'login' = 通常ログイン / 'reset' = パスワード再設定。
  const [mode, setMode] = useState<'login' | 'reset'>('login');
  const [isDemoSheetOpen, setIsDemoSheetOpen] = useState(false);

  return (
    <>
      <main className='flex flex-1 flex-col justify-center gap-9 py-10'>
        <header className='flex flex-col gap-2 px-1'>
          <h1 className='font-bold text-[34px] text-primary leading-none tracking-tight'>
            {appName}
          </h1>
          <p className='text-[14px] text-muted-foreground'>{tagline}</p>
        </header>

        {mode === 'login' ? (
          <LoginForm onShowReset={() => setMode('reset')} />
        ) : (
          <ResetForm onBack={() => setMode('login')} />
        )}

        <button
          className='h-13 w-full rounded-xl bg-secondary font-bold text-[17px] text-primary outline-none focus-visible:ring-2 focus-visible:ring-ring'
          onClick={() => setIsDemoSheetOpen(true)}
          type='button'
        >
          {action.demo}
        </button>
      </main>

      <footer
        className='flex items-center justify-center gap-6 text-[13px] text-muted-foreground'
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 28px)' }}
      >
        <a
          className='flex items-center gap-1.5 hover:text-foreground'
          href={TUTORIAL_URL}
          rel='noopener noreferrer'
          target='_blank'
        >
          <IconManual aria-hidden='true' className='size-4' />
          {action.tutorial}
          <IconOpenInNew aria-hidden='true' className='size-3' />
        </a>
        <Link
          className='flex items-center gap-1.5 hover:text-foreground'
          href='/inquiry'
        >
          <IconMail aria-hidden='true' className='size-4' />
          {action.inquiry}
        </Link>
      </footer>

      <DemoSelectSheet
        isOpen={isDemoSheetOpen}
        onOpenChange={setIsDemoSheetOpen}
      />
    </>
  );
}

function LoginForm({ onShowReset }: { onShowReset: () => void }) {
  const [result, login, isPending] = useFormAction(loginAction);
  const [form, fields] = useForm({
    lastResult: result?.submission,
    onValidate: ({ formData }) =>
      parseWithZod(formData, { schema: loginSchema })
  });

  return (
    <form
      {...getFormProps(form)}
      action={login}
      className='flex flex-col gap-2'
    >
      <LoginField
        autoComplete='email'
        field={fields.email}
        label={field.email}
        type='email'
      />
      <LoginField
        autoComplete='current-password'
        field={fields.password}
        label={field.password}
        revealable
        type='password'
      />
      <SheetSubmitButton
        className='mt-3'
        isPending={isPending}
        label={action.login}
      />
      <TextLinkButton onClick={onShowReset}>{action.showReset}</TextLinkButton>
    </form>
  );
}

function ResetForm({ onBack }: { onBack: () => void }) {
  const [result, send, isPending] = useFormAction(resetPasswordAction);
  const [form, fields] = useForm({
    lastResult: result?.submission,
    onValidate: ({ formData }) =>
      parseWithZod(formData, { schema: resetPasswordSchema })
  });

  return (
    <form {...getFormProps(form)} action={send} className='flex flex-col gap-2'>
      <div className='mb-2 flex flex-col gap-1 px-1'>
        <h2 className='font-semibold text-[17px]'>{reset.title}</h2>
        <p className='text-[13px] text-muted-foreground'>{reset.hint}</p>
      </div>
      <LoginField
        autoComplete='email'
        field={fields.email}
        label={field.email}
        type='email'
      />
      <SheetSubmitButton
        className='mt-3'
        isPending={isPending}
        label={action.sendReset}
      />
      <TextLinkButton onClick={onBack}>{action.backToLogin}</TextLinkButton>
    </form>
  );
}

// 主ボタンの下に置く文字だけの導線（再設定へ / ログインへ戻る）。
function TextLinkButton({
  onClick,
  children
}: {
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      className='mt-1 h-11 self-center rounded-lg px-3 font-medium text-[14px] text-primary outline-none focus-visible:ring-2 focus-visible:ring-ring'
      onClick={onClick}
      type='button'
    >
      {children}
    </button>
  );
}
