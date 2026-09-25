'use client';

import { cn } from 'cn';
import { type ComponentProps, useState } from 'react';

// 新デザインの入力欄。ラベルを左に置いた 1 行の白い面（デザイン基礎の各シート）。
// 枠線は持たず、地との明度差だけで入力欄と分かる。
//
// counter を付けると右端に「{n}/{maxLength}」を出す（予定カテゴリ・口座・リマインダーの名前）。
// 入力値は呼び出し側が制御してもしなくてもよく、非制御のときは内部で文字数だけ数える。

export function TextField({
  label,
  className,
  errors,
  errorId,
  counter = false,
  height = 48,
  onChange,
  ...props
}: {
  label: string;
  errors?: string[];
  errorId?: string;
  counter?: boolean;
  height?: 48 | 52;
} & ComponentProps<'input'>) {
  const [length, setLength] = useState(
    String(props.value ?? props.defaultValue ?? '').length
  );
  const shownLength =
    props.value !== undefined ? String(props.value).length : length;

  return (
    <div className='flex flex-col gap-1.5'>
      <label
        className={cn(
          'flex items-center gap-2.5 rounded-xl bg-card px-3.5',
          height === 48 ? 'h-12' : 'h-13'
        )}
      >
        <span className='shrink-0 text-[13px] text-muted-foreground'>
          {label}
        </span>
        <input
          className={cn(
            'min-w-0 flex-grow bg-transparent font-semibold text-[17px] text-foreground outline-none',
            className
          )}
          onChange={(event) => {
            setLength(event.target.value.length);
            onChange?.(event);
          }}
          type='text'
          {...props}
        />
        {counter && props.maxLength !== undefined ? (
          <span className='shrink-0 text-muted-foreground text-xs'>
            {shownLength}/{props.maxLength}
          </span>
        ) : null}
      </label>
      {errors ? (
        <p className='px-1 text-destructive text-sm' id={errorId} role='alert'>
          {errors.join(' / ')}
        </p>
      ) : null}
    </div>
  );
}
