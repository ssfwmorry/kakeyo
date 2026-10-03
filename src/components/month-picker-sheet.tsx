'use client';

import { cn } from 'cn';
import { useState } from 'react';
import { IconChevronLeft, IconChevronRight } from '@/components/icons';
import { SheetHeader } from '@/components/sheet-header';
import { BottomSheet, BottomSheetContent } from '@/components/ui/bottom-sheet';

// 表示する月を選ぶシート。選んだ時点で確定して閉じる（「決定」は置かない）。

const TITLE = '表示する月';

// 選べる下限の年。これより前は記録が無い。
const MIN_YEAR = 2023;

const MONTHS = Array.from({ length: 12 }, (_, index) => index + 1);

export function MonthPickerSheet({
  yearMonth,
  todayYearMonth,
  onSelect,
  onOpenChange
}: {
  // 現在表示中の 'YYYY-MM'。開いたときの年と選択中の月の基準になる。
  yearMonth: string;
  // 今月の 'YYYY-MM'。遠くの月を見ているときに戻り先が分かるよう輪郭で示す。
  todayYearMonth: string;
  onSelect: (yearMonth: string) => void;
  onOpenChange: (open: boolean) => void;
}) {
  const [currentYear, currentMonth] = yearMonth.split('-').map(Number);
  const [todayYear, todayMonth] = todayYearMonth.split('-').map(Number);
  // シートの中だけで動く年。閉じると捨てる。
  const [year, setYear] = useState(currentYear);
  const canGoPrev = year > MIN_YEAR;

  return (
    <BottomSheet onOpenChange={onOpenChange} open>
      <BottomSheetContent aria-label={TITLE}>
        <SheetHeader
          left='close'
          onLeft={() => onOpenChange(false)}
          title={TITLE}
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
              const isToday = year === todayYear && month === todayMonth;
              return (
                <button
                  aria-current={isToday ? 'date' : undefined}
                  aria-pressed={isSelected}
                  className={cn(
                    'h-11 rounded-xl text-[15px]',
                    isSelected
                      ? 'bg-primary font-bold text-primary-foreground'
                      : 'bg-background text-foreground',
                    // 今月の印。表示中と重なるときは塗りだけで十分なので輪郭は出さない。
                    isToday &&
                      !isSelected &&
                      'font-semibold text-primary ring-1 ring-primary ring-inset'
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
