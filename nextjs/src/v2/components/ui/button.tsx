'use client';

import { Button as ButtonPrimitive } from '@base-ui/react/button';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from 'cn';

// 新デザインのボタン。default / secondary / ghost / destructive の 4 種に集約する
// （デザイン基礎「shadcn をこの見た目に寄せる」）。既存 components/ui/button.tsx とは
// 角丸と高さが全面的に違うので別部品にしている。
//
// 高さは 44 を基準にする。デザイン上のボタンは 48（主要操作）と 44（それ以外）で、
// どちらもタップ領域の下限 44 を満たす。

const buttonVariants = cva(
  'inline-flex shrink-0 items-center justify-center gap-2 rounded-xl font-semibold text-base whitespace-nowrap transition-colors outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground',
        // 面の上に置く副ボタン。アクセント淡の地にアクセントの文字。
        secondary: 'bg-secondary text-primary',
        // 地の上に文字だけ。リスト末尾の「◯◯を追加」もこれを白面に載せて作る。
        ghost: 'bg-transparent text-primary',
        destructive: 'bg-transparent text-destructive'
      },
      size: {
        // 主要操作（シートの「保存する」など）。
        default: 'h-12 px-4',
        // それ以外。
        sm: 'h-11 px-3.5',
        // 画面幅いっぱいに置く行型のボタン（「リマインダーを追加」など）。
        row: 'h-12 w-full justify-start px-3.5'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
);

export function Button({
  className,
  variant,
  size,
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      className={cn(buttonVariants({ variant, size, className }))}
      data-slot='button'
      {...props}
    />
  );
}

export { buttonVariants };
