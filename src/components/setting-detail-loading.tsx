import { SectionList } from '@/components/section-list';
import { Skeleton, skeletonKeys } from '@/components/ui/skeleton';

// 設定配下の詳細画面（カテゴリ・方法・口座・定期・予定カテゴリ・リマインダー）の骨格。
// どれも「戻るヘッダ + 見出し + カード + 数行」の同じ形なので 1 つにまとめる。
// 行数は画面によって変わるので控えめに置き、足りないぶんは解決時に伸びる。

export function SettingDetailLoading({
  rows = 3,
  hasSegment = false
}: {
  rows?: number;
  // 支出／収入のような切替を持つ画面か。
  hasSegment?: boolean;
}) {
  return (
    <div className='flex flex-col'>
      <div className='grid h-11 grid-cols-[1fr_auto_1fr] items-center px-2'>
        <Skeleton className='h-4 w-16 justify-self-start' />
      </div>
      <div className='flex flex-col gap-3 px-4'>
        <Skeleton className='h-9 w-32' />
        {hasSegment ? (
          <Skeleton className='h-[38px] w-full rounded-[10px]' />
        ) : null}
        <SectionList>
          {skeletonKeys(rows).map((key) => (
            <div className='flex h-13 items-center gap-3 px-3.5' key={key}>
              <Skeleton className='size-6 shrink-0 rounded-lg' />
              <Skeleton className='h-4 w-28 flex-grow' />
            </div>
          ))}
        </SectionList>
      </div>
    </div>
  );
}
