'use client';

import { cn } from 'cn';
import type { ComponentProps } from 'react';

// シート末尾の主ボタン。「追加する」「保存する」「登録する」など、そのシートの
// 唯一の主操作を h52 のアクセント塗りで出す（共通仕様「ボトムシート」）。
//
// 押せないときは灰色にして、押せない理由（「名前を入れると追加できます」）を
// ボタンの文字にする。活性の判定は呼び出し側がクライアント状態で行い、
// 必須エラーを別に出さない。
//
// bar を付けると、全高固定のシートで下端に張り付く保存バー（地色の帯）に包む。

export function SheetSubmitButton({
  label,
  disabledLabel,
  disabled = false,
  bar = false,
  className,
  ...props
}: {
  label: string;
  // disabled のときに代わりに出す文言。
  disabledLabel?: string;
  bar?: boolean;
} & Omit<ComponentProps<'button'>, 'children'>) {
  const button = (
    <button
      className={cn(
        'h-13 w-full shrink-0 rounded-xl',
        disabled
          ? 'bg-disabled font-semibold text-[15px] text-muted-foreground'
          : 'bg-primary font-bold text-[17px] text-primary-foreground',
        className
      )}
      disabled={disabled}
      type='submit'
      {...props}
    >
      {disabled && disabledLabel !== undefined ? disabledLabel : label}
    </button>
  );
  if (!bar) {
    return button;
  }
  return (
    <div
      className='-mx-4 mt-auto shrink-0 bg-background px-4 pt-2.5'
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 34px)' }}
    >
      {button}
    </div>
  );
}
