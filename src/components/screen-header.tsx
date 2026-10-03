import Link from 'next/link';
import { IconChevronLeft } from '@/components/icons';

// 詳細画面の上端。左に「＜ 戻り先」。タブバー直下のトップ画面ではなく、
// 設定から 1 段降りた画面が使う。画面の名前は本文側の大見出し（ScreenTitle）で出す。

export function ScreenHeader({
  backHref,
  backLabel
}: {
  backHref: string;
  // 戻り先の名前。「＜ 設定」のように出す。
  backLabel: string;
}) {
  return (
    <div className='flex h-11 items-center px-1'>
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
    </div>
  );
}
