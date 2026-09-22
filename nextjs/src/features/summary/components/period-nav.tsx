'use client';

import { MonthJumpPicker } from '@/components/month-jump-picker';
import { Button } from '@/components/ui/button';

// 月移動 / 年移動の共通ナビ（＜ ラベル ＞）。
// 中央に現在の期間ラベル、右にサブタイトル（合計など）を任意で出す。
// 月ナビでは jumpYearMonth / onJump を渡すと中央ラベルが年月ダイレクトジャンプ
// （タイトルタップ→年→月ピッカー）になる。

type PeriodNavProps = {
  label: string;
  subtitle?: string;
  onPrev: () => void;
  onNext: () => void;
  disabled?: boolean;
  // 年月ジャンプを有効にする場合の現在 'YYYY-MM'（月ナビでのみ渡す）。
  jumpYearMonth?: string;
  onJump?: (yearMonth: string) => void;
};

export function PeriodNav({
  label,
  subtitle,
  onPrev,
  onNext,
  disabled,
  jumpYearMonth,
  onJump
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
        {jumpYearMonth && onJump ? (
          <MonthJumpPicker
            yearMonth={jumpYearMonth}
            label={label}
            onSelect={onJump}
          />
        ) : (
          <span className='font-medium text-sm'>{label}</span>
        )}
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
