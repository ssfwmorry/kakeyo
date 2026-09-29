import { Skeleton } from '@/components/ui/skeleton';
import { SummaryLoading } from '@/features/summary/components/summary-loading';

// 精算。金額の見出しと明細カードの枠だけを出す。
export default function SummarySettlementLoading() {
  return (
    <SummaryLoading>
      <Skeleton className='h-28 w-full rounded-2xl' />
      <Skeleton className='h-40 w-full rounded-2xl' />
    </SummaryLoading>
  );
}
