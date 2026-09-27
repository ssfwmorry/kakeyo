'use client';

import { cn } from 'cn';
import { useState } from 'react';
import { IconChevronLeft, IconChevronRight } from '@/components/icons';
import { SheetHeader } from '@/components/sheet-header';
import { BottomSheet, BottomSheetContent } from '@/components/ui/bottom-sheet';
import { summaryLabels } from '../labels';

// 表示する月を選ぶシート（原典 SumBreakdownPicker）。年を送りながら 12 か月から選ぶ。
// 選んだ時点で確定してシートを閉じる（「決定」は置かない）。

// 選べる下限の年。これより前は記録が無い。
const MIN_YEAR = 2023;

const MONTHS = Array.from({ length: 12 }, (_, index) => index + 1);

export function MonthPickerSheet({
  yearMonth,
  onSelect,
  onOpenChange
}: {
  // 現在表示中の 'YYYY-MM'。開いたときの年と選択中の月の基準になる。
  yearMonth: string;
  onSelect: (yearMonth: string) => void;
  onOpenChange: (open: boolean) => void;
}) {
  const [currentYear, currentMonth] = yearMonth.split('-').map(Number);
  // シートの中だけで動く年。閉じると捨てる。
  const [year, setYear] = useState(currentYear);
  const canGoPrev = year > MIN_YEAR;

  return (
    <BottomSheet onOpenChange={onOpenChange} open>
      <BottomSheetContent aria-label={summaryLabels.heading.monthPicker}>
        <SheetHeader
          left='close'
          onLeft={() => onOpenChange(false)}
          title={summaryLabels.heading.monthPicker}
        />

        <div className='flex flex-col gap-2.5 rounded-[14px] bg-card px-3 pt-2 pb-3.5'>
          <div className='flex h-11 items-center justify-between'>
            <YearNavButton
              direction='prev'
              disabled={!canGoPrev}
              onClick={() => setYear(year - 1)}
            />
            <span className='font-semibold text-[17px]'>{year}年</span>
            <YearNavButton direction='next' onClick={() => setYear(year + 1)} />
          </div>

          <div className='grid grid-cols-4 gap-2'>
            {MONTHS.map((month) => {
              const isSelected = year === currentYear && month === currentMonth;
              return (
                <button
                  aria-pressed={isSelected}
                  className={cn(
                    'h-11 rounded-xl text-[15px]',
                    isSelected
                      ? 'bg-primary font-bold text-primary-foreground'
                      : 'bg-background text-foreground'
                  )}
                  key={month}
                  onClick={() =>
                    onSelect(`${year}-${String(month).padStart(2, '0')}`)
                  }
                  type='button'
                >
                  {month}月
                </button>
              );
            })}
          </div>
        </div>

        <span className='px-1 text-muted-foreground text-xs leading-relaxed'>
          {summaryLabels.note.monthPicker}
        </span>
      </BottomSheetContent>
    </BottomSheet>
  );
}

function YearNavButton({
  direction,
  disabled,
  onClick
}: {
  direction: 'prev' | 'next';
  disabled?: boolean;
  onClick: () => void;
}) {
  const Icon = direction === 'prev' ? IconChevronLeft : IconChevronRight;
  return (
    <button
      aria-label={direction === 'prev' ? '前の年' : '次の年'}
      className='flex size-9 items-center justify-center rounded-full bg-background text-foreground disabled:text-icon-muted'
      disabled={disabled}
      onClick={onClick}
      type='button'
    >
      <Icon aria-hidden='true' className='size-4' strokeWidth={2.4} />
    </button>
  );
}
