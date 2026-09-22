'use client';

import { Button } from '@/components/ui/button';

// 月移動 / 年移動の共通ナビ（＜ ラベル ＞）。旧 PaginationBar の最小移植。
// 中央に現在の期間ラベル、右にサブタイトル（合計など）を任意で出す。

type PeriodNavProps = {
  label: string;
  subtitle?: string;
  onPrev: () => void;
  onNext: () => void;
  disabled?: boolean;
};

export function PeriodNav({
  label,
  subtitle,
  onPrev,
  onNext,
  disabled
}: PeriodNavProps) {
  return (
    <div className='flex items-center justify-between gap-2 py-2'>
      <Button
        type='button'
        variant='outline'
        size='sm'
        onClick={onPrev}
        disabled={disabled}
        aria-label='前へ'
      >
        ＜
      </Button>
      <div className='flex flex-col items-center'>
        <span className='font-medium text-sm'>{label}</span>
        {subtitle ? (
          <span className='text-muted-foreground text-xs'>{subtitle}</span>
        ) : null}
      </div>
      <Button
        type='button'
        variant='outline'
        size='sm'
        onClick={onNext}
        disabled={disabled}
        aria-label='次へ'
      >
        ＞
      </Button>
    </div>
  );
}
