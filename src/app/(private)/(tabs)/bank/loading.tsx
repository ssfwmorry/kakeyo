import { SectionList } from '@/components/section-list';
import { Skeleton, skeletonKeys } from '@/components/ui/skeleton';

// 口座の骨格。総資産カードの枠と口座行は形が決まっているので実寸で置く。
// 推移グラフは中身（折れ線）を出さず、面積だけを確保する（アスペクト比 326:96）。

const BANK_ROWS = 2;

export default function BankLoading() {
  return (
    <div className='flex flex-col gap-3 px-4'>
      <div className='flex h-11 items-center justify-between' />

      <div className='flex items-center'>
        <Skeleton className='h-9 w-20' />
      </div>

      <section className='flex flex-col gap-2.5 rounded-2xl bg-card p-4'>
        <Skeleton className='h-4 w-36' />
        <div className='flex items-baseline gap-2'>
          <Skeleton className='h-9 w-40' />
        </div>
        <Skeleton className='aspect-[326/96] w-full' />
      </section>

      <div className='-mb-1 flex items-center px-1'>
        <Skeleton className='h-4 w-28' />
      </div>

      <SectionList radius={16}>
        {skeletonKeys(BANK_ROWS).map((key, index) => (
          <div key={key}>
            {index === 0 ? null : <div className='ml-9 h-px bg-border' />}
            <div className='flex h-13 items-center gap-3 px-3.5'>
              <Skeleton className='size-2.5 shrink-0 rounded-full' />
              <Skeleton className='h-4 w-24 flex-grow' />
            </div>
          </div>
        ))}
      </SectionList>
    </div>
  );
}
