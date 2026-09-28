import { Skeleton, skeletonKeys } from '@/components/ui/skeleton';
import { SummaryLoading } from '@/features/summary/components/summary-loading';

// 記録一覧。行の高さは確定しているので数行ぶんの枠を置く。
const ROWS = 6;

export default function SummaryRecordsLoading() {
  return (
    <SummaryLoading>
      <div className='overflow-hidden rounded-2xl bg-card'>
        {skeletonKeys(ROWS).map((key) => (
          <div className='flex h-13 items-center gap-3 px-3.5' key={key}>
            <Skeleton className='size-2.5 shrink-0 rounded-full' />
            <Skeleton className='h-4 w-28 flex-grow' />
          </div>
        ))}
      </div>
    </SummaryLoading>
  );
}
