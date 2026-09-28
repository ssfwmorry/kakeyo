'use client';

import { cn } from 'cn';
import type { ComponentProps } from 'react';

// 36px の丸いアイコンボタン。面（弱）の地に黒のアイコン。シートの「閉じる」「戻る」、
// 日付の「前の日」「次の日」、金額の「クリア」など、デザインの各シートで同じ形で出る。
//
// 削除（ゴミ箱）はアイコンだけ赤にする。地は同じ。

export function RoundIconButton({
  className,
  tone = 'default',
  ...props
}: ComponentProps<'button'> & {
  // 'destructive' はアイコンを赤にする（削除）。'soft' は地を画面の地色にする（カード内）。
  tone?: 'default' | 'destructive' | 'soft';
}) {
  return (
    <button
      className={cn(
        'flex size-9 shrink-0 items-center justify-center rounded-full disabled:text-icon-muted',
        tone === 'soft' ? 'bg-background' : 'bg-muted',
        tone === 'destructive' ? 'text-destructive' : 'text-foreground',
        className
      )}
      type='button'
      {...props}
    />
  );
}
