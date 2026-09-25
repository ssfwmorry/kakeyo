import { cn } from 'cn';
import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';
import { IconChevronLeft } from '@/components/icons';

// 詳細画面の上端。左に「＜ 戻り先」、右に画面ごとのアクション（「編集」など）。
// タブバー直下のトップ画面ではなく、設定から 1 段降りた画面が使う。
//
// 中央のタイトルは編集画面（「カテゴリを編集」）だけが持つ。一覧画面は本文側の
// 大見出し（ScreenTitle）で名前を出すので中央は空ける。

export function ScreenHeader({
  backHref,
  backLabel,
  title,
  action
}: {
  backHref: string;
  // 戻り先の名前。「＜ 設定」のように出す。
  backLabel: string;
  // 中央のタイトル。
  title?: ReactNode;
  // 右端のアクション。「編集」ボタンなど。
  action?: ReactNode;
}) {
  return (
    <div className='grid h-11 grid-cols-[1fr_auto_1fr] items-center px-2'>
      <Link
        className='flex h-11 items-center gap-0.5 justify-self-start px-2 text-base text-primary'
        href={backHref}
      >
        <IconChevronLeft
          aria-hidden='true'
          className='size-5'
          strokeWidth={2.4}
        />
        {backLabel}
      </Link>
      <span className='font-semibold text-[17px]'>{title}</span>
      <span className='justify-self-end'>{action}</span>
    </div>
  );
}

// ヘッダー右のテキストボタン（「編集」「完了」「並べ替え」「保存」）。
export function ScreenHeaderAction({
  children,
  bold = false,
  ...props
}: { bold?: boolean } & ComponentProps<'button'>) {
  return (
    <button
      className={cn(
        'h-11 px-2 text-base text-primary disabled:opacity-50',
        bold ? 'font-bold' : 'font-semibold'
      )}
      type='button'
      {...props}
    >
      {children}
    </button>
  );
}
