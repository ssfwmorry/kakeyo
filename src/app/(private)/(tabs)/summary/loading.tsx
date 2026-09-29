import { Skeleton } from '@/components/ui/skeleton';
import { SummaryLoading } from '@/features/summary/components/summary-loading';

// 内訳。円グラフは中身を出さず、面積だけ確保する。
export default function SummaryBreakdownLoading() {
  return (
    <SummaryLoading>
      <div className='flex justify-center py-2'>
        <Skeleton className='size-44 rounded-full' />
      </div>
      <Skeleton className='h-40 w-full rounded-2xl' />
    </SummaryLoading>
  );
}
