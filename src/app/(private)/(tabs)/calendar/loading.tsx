import { cn } from 'cn';
import { Skeleton, skeletonKeys } from '@/components/ui/skeleton';

// カレンダーの骨格。
//
// 曜日行は月に依らず固定なので本物をそのまま出す。日付の数字は「いま何月か」に
// 依存し、loading.tsx は静的に評価されて実際の月を知らないため出さない（嘘になる）。
// 週数も月によって 4〜6 週と変わるので、中間の 5 週で枠だけ置く。

const WEEKDAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'] as const;
const WEEKS = 5;

export default function CalendarLoading() {
  return (
    <div className='flex flex-col gap-3 px-4'>
      <div className='flex h-11 items-center justify-between' />

      <div className='flex items-center gap-2'>
        <Skeleton className='h-9 w-16' />
        <Skeleton className='mt-1.5 h-5 w-10' />
      </div>

      <div className='-mx-4 border-y bg-card'>
        <div className='grid h-6 grid-cols-7 items-center text-center font-semibold text-[11px]'>
          {WEEKDAY_LABELS.map((label, index) => (
            <span
              className={cn(
                index === 0 && 'text-destructive',
                index === 6 && 'text-[var(--saturday)]',
                index > 0 && index < 6 && 'text-muted-foreground'
              )}
              key={label}
            >
              {label}
            </span>
          ))}
        </div>
        <div className='grid grid-cols-7'>
          {skeletonKeys(WEEKS * 7).map((key) => (
            <div className='h-18 border-line-soft border-t' key={key} />
          ))}
        </div>
      </div>

      <div className='grid grid-cols-2 gap-2.5'>
        <Skeleton className='h-11 rounded-xl' />
        <Skeleton className='h-11 rounded-xl' />
      </div>
    </div>
  );
}
