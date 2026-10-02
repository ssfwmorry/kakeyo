'use client';

import { type FieldMetadata, getInputProps } from '@conform-to/react';
import { cn } from 'cn';
import { type ComponentProps, useState } from 'react';
import { IconEye, IconEyeOff } from '@/components/icons';

// ログイン画面の入力欄。ラベルを上に載せた h64 の白い面。
//
// アプリ内の TextField（ラベル左の 1 行）はメールアドレスのように長い値だと
// 入力の幅が足りない。この画面は欄が 2 つしかないので、1 欄を大きく取って
// ラベルを上に置く。枠線は持たず、フォーカスと入力エラーはリングで面ごと示す。
//
// 伏字トグルは label の外に置く。label の中に button を入れると labelable 要素が
// 2 つになり、label を押したときの行き先が壊れる。

type LoginFieldProps = {
  label: string;
  field: FieldMetadata<string>;
  type?: 'email' | 'password';
  autoComplete?: ComponentProps<'input'>['autoComplete'];
  // type='password' のとき、右端に表示/伏字の目玉トグルを出す。
  revealable?: boolean;
};

export function LoginField({
  label,
  field,
  type = 'email',
  autoComplete,
  revealable = false
}: LoginFieldProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  const hasToggle = revealable && type === 'password';
  const inputProps = getInputProps(field, {
    type: hasToggle && isRevealed ? 'text' : type
  });
  const hasErrors = field.errors !== undefined && field.errors.length > 0;

  return (
    <div className='flex flex-col gap-1.5'>
      <div
        className={cn(
          'flex h-16 items-center gap-3 rounded-xl bg-card pr-3 pl-4 ring-ring transition-shadow focus-within:ring-2',
          hasErrors && 'ring-2 ring-destructive focus-within:ring-destructive'
        )}
      >
        <label className='flex min-w-0 flex-1 flex-col gap-0.5'>
          <span className='text-[13px] text-muted-foreground'>{label}</span>
          <input
            {...inputProps}
            autoComplete={autoComplete}
            className='w-full min-w-0 bg-transparent font-semibold text-[17px] text-foreground outline-none'
          />
        </label>
        {hasToggle ? (
          <RevealToggle
            isRevealed={isRevealed}
            onToggle={() => setIsRevealed((prev) => !prev)}
          />
        ) : null}
      </div>
      {hasErrors ? (
        <p
          className='px-1 text-destructive text-sm'
          id={field.errorId}
          role='alert'
        >
          {field.errors?.join(' / ')}
        </p>
      ) : null}
    </div>
  );
}

// パスワードの表示/伏字トグル。
function RevealToggle({
  isRevealed,
  onToggle
}: {
  isRevealed: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      aria-label={isRevealed ? 'パスワードを隠す' : 'パスワードを表示'}
      aria-pressed={isRevealed}
      className='flex size-9 shrink-0 items-center justify-center rounded-full text-icon-muted outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring'
      onClick={onToggle}
      type='button'
    >
      {isRevealed ? (
        <IconEyeOff aria-hidden='true' className='size-5' />
      ) : (
        <IconEye aria-hidden='true' className='size-5' />
      )}
    </button>
  );
}
