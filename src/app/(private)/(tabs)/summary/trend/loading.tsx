import { Skeleton } from '@/components/ui/skeleton';
import { SummaryLoading } from '@/features/summary/components/summary-loading';

// 推移。棒グラフは中身を出さず、面積だけ確保する。
export default function SummaryTrendLoading() {
  return (
    <SummaryLoading>
      <Skeleton className='h-52 w-full rounded-2xl' />
      <Skeleton className='h-40 w-full rounded-2xl' />
    </SummaryLoading>
  );
}
