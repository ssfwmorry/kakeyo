import Link from 'next/link';
import type { ReactNode } from 'react';
import { IconChevronLeft } from '@/components/icons';

// 詳細画面の上端。左に「＜ 戻り先」、右に画面ごとのアクション（「編集」など）。
// タブバー直下のトップ画面ではなく、設定から 1 段降りた画面が使う。
//
// 中央にタイトルを置かないのは、新デザインが見出しを本文側の大見出し（ScreenTitle）で
// 出すため。ここは戻る導線とアクションだけを持つ。

export function ScreenHeader({
  backHref,
  backLabel,
  action
}: {
  backHref: string;
  // 戻り先の名前。「＜ 設定」のように出す。
  backLabel: string;
  // 右端のアクション。「編集」ボタンなど。
  action?: ReactNode;
}) {
  return (
    <div className='flex h-11 items-center justify-between px-2'>
      <Link
        className='flex h-11 items-center gap-0.5 px-2 text-base text-primary'
        href={backHref}
      >
        <IconChevronLeft
          aria-hidden='true'
          className='size-5'
          strokeWidth={2.4}
        />
        {backLabel}
      </Link>
      {action}
    </div>
  );
}
