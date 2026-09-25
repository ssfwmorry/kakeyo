'use client';

import { cn } from 'cn';
import type { ComponentProps } from 'react';

// 日付・方法の選択肢に使う丸いチップ（デザイン Note）。選択中はアクセントで塗る。
// 横に並べて 1 つだけ選ぶ用途なので aria-pressed で状態を出す。

export function Chip({
  isSelected,
  className,
  ...props
}: { isSelected: boolean } & Omit<ComponentProps<'button'>, 'type'>) {
  return (
    <button
      aria-pressed={isSelected}
      className={cn(
        'h-9 shrink-0 whitespace-nowrap rounded-full px-3.5 font-semibold text-sm',
        isSelected
          ? 'bg-primary text-primary-foreground'
          : 'bg-card text-foreground',
        className
      )}
      type='button'
      {...props}
    />
  );
}
