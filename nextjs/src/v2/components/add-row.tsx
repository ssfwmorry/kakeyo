'use client';

import { cn } from 'cn';
import Link from 'next/link';
import type { ComponentProps } from 'react';
import { IconPlus } from '@/components/icons';

// リストの下に置く「◯◯を追加」。白い面にアクセント色の文字で、リストのカードと同じ幅・
// 同じ角丸で並ぶ（デザイン基礎の各設定画面）。
//
// リストと同じ見た目だがセルではなく操作なので、ListCell ではなくボタンとして持つ。

const ROW_CLASS =
  'flex h-12 w-full items-center gap-2.5 rounded-[14px] bg-card px-3.5 font-semibold text-base text-primary';

function PlusIcon() {
  return <IconPlus aria-hidden='true' className='size-5' strokeWidth={2.4} />;
}

// その場でシートを開くなど、同じ画面で追加するとき。
export function AddRow({
  label,
  className,
  ...props
}: { label: string } & ComponentProps<'button'>) {
  return (
    <button className={cn(ROW_CLASS, className)} type='button' {...props}>
      <PlusIcon />
      {label}
    </button>
  );
}

// 追加画面へ遷移するとき。
export function AddRowLink({
  label,
  className,
  href
}: {
  label: string;
  className?: string;
  href: ComponentProps<typeof Link>['href'];
}) {
  return (
    <Link className={cn(ROW_CLASS, className)} href={href}>
      <PlusIcon />
      {label}
    </Link>
  );
}
