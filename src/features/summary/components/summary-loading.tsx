import { Skeleton } from '@/components/ui/skeleton';

// 集計 3 画面（内訳・推移・精算）で共通の骨格。
// ヘッダ・見出し・タブ・月ナビまでは 3 画面とも同じ形なので、ここまでを出す。
// グラフの中身は画面ごとに違い形も可変なので、本体は呼び出し側が渡す。

export function SummaryLoading({ children }: { children?: React.ReactNode }) {
  return (
    <div className='flex flex-col gap-3 px-4'>
      <div className='flex h-11 items-center justify-between' />

      <Skeleton className='h-9 w-20' />

      <Skeleton className='h-[38px] w-full rounded-[10px]' />

      <div className='flex items-center gap-1'>
        <Skeleton className='size-9 rounded-lg' />
        <Skeleton className='h-9 w-28 rounded-lg' />
        <Skeleton className='size-9 rounded-lg' />
      </div>

      {children}
    </div>
  );
}
