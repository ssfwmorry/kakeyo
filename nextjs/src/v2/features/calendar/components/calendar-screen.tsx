'use client';

import Link from 'next/link';
import { useMemo, useState, useTransition } from 'react';
import { IconChevronLeft, IconPlus } from '@/components/icons';
import type {
  CalendarInitialData,
  CalendarMonthData
} from '@/features/calendar';
import { getCalendarMonthAction } from '@/features/calendar/actions';
import {
  selectDayPlans,
  selectDayReminders
} from '@/features/calendar/domain/day-events';
import { shiftMonth } from '@/features/calendar/domain/period';
import { formatDateWithWeekdayJst } from '@/lib/shared/domain/date';
import { formatPrefixedSum } from '@/lib/shared/domain/priceDisplay';
import { PairModeSegment } from '@/v2/components/pair-mode-segment';
import { ThemeToggle } from '@/v2/components/theme-toggle';
import { assignEventLanes, type LaneEvent } from '../domain/event-lanes';
import { buildMonthGrid } from '../domain/month-grid';
import { DayDetailList } from './day-detail-list';
import { MonthGrid } from './month-grid';
import { TodoChips } from './todo-chips';

// カレンダー（ホーム・新デザイン）。
//
// 既存は FullCalendar だが、新デザインはセルが「日付・収支・予定の帯」の 3 段で、
// 帯が複数日にまたがる。ライブラリのレイアウトに載せるより自前のグリッドで組むほうが
// 素直なので置き換えた（段の割り当ては domain/event-lanes.ts）。
//
// 月移動は既存の Server Action をそのまま使う。取得中も前の月を出したままにして、
// 画面が空白になるのを避ける。

// セルに出す帯の段数。3 段以上入れると 1 マスが高くなりすぎて月が見渡せない。
const MAX_LANES = 2;

export function CalendarScreen({ initial }: { initial: CalendarInitialData }) {
  const [month, setMonth] = useState<CalendarMonthData>(initial.month);
  const [selectedDate, setSelectedDate] = useState(initial.today);
  const [isPending, startTransition] = useTransition();

  const moveMonth = (delta: number) => {
    const nextYearMonth = shiftMonth(month.yearMonth, delta);
    startTransition(async () => {
      setMonth(await getCalendarMonthAction(nextYearMonth));
    });
    // 月を変えたら選択日もその月の 1 日へ送る（前月の日を選んだままにしない）。
    setSelectedDate(`${nextYearMonth}-01`);
  };

  const cells = useMemo(
    () => buildMonthGrid(month.yearMonth),
    [month.yearMonth]
  );

  const daySums = useMemo(
    () => new Map(month.days.map((day) => [day.dateStr, day])),
    [month.days]
  );

  // 予定とリマインダーを同じ形に寄せてから段を割り当てる。
  const lanes = useMemo(() => {
    const events: LaneEvent[] = [
      ...month.plans.map((plan) => ({
        colorName: plan.planTypeColorName ?? 'grey',
        endDate: plan.endDate,
        id: `plan-${plan.id}`,
        isReminder: false,
        name: plan.name,
        startDate: plan.startDate
      })),
      ...month.reminders.map((reminder) => ({
        colorName: reminder.colorName,
        endDate: reminder.date,
        id: `reminder-${reminder.id}`,
        isReminder: true,
        name: reminder.name,
        startDate: reminder.date
      }))
    ];
    return assignEventLanes(events, MAX_LANES);
  }, [month.plans, month.reminders]);

  const [year, monthPart] = month.yearMonth.split('-');

  return (
    <div className='flex flex-col gap-3 px-4 pb-6'>
      <div className='flex h-11 items-center justify-end gap-1.5'>
        <ThemeToggle />
        <PairModeSegment isPair={initial.isPair} />
      </div>

      <div className='flex items-center gap-2'>
        <h1 className='font-bold text-3xl'>{Number(monthPart)}月</h1>
        <span className='mt-1.5 text-[17px] text-muted-foreground'>{year}</span>
        <span className='mt-2 flex items-baseline gap-1'>
          <span className='text-muted-foreground text-xs'>収支</span>
          {/* monthSum は「支出=正」向き。符号の付け方は共通の整形関数に委ねる
              （summary と同じ見え方に揃える）。 */}
          <span className='font-semibold text-[15px] tabular-nums'>
            {formatPrefixedSum(month.monthSum)}
          </span>
        </span>
        <div className='ml-auto flex gap-1.5'>
          <MonthNavButton
            direction='prev'
            isPending={isPending}
            onClick={() => moveMonth(-1)}
          />
          <MonthNavButton
            direction='next'
            isPending={isPending}
            onClick={() => moveMonth(1)}
          />
        </div>
      </div>

      <MonthGrid
        cells={cells}
        daySums={daySums}
        lanes={lanes}
        onSelect={setSelectedDate}
        selectedDate={selectedDate}
        today={initial.today}
      />

      <div className='grid grid-cols-2 gap-2.5'>
        <Link
          className='flex h-11 items-center justify-center gap-1.5 rounded-xl bg-primary font-semibold text-[15px] text-primary-foreground'
          href={`/note?date=${selectedDate}`}
        >
          <IconPlus aria-hidden='true' className='size-4.5' strokeWidth={2.4} />
          記録
        </Link>
        <Link
          className='flex h-11 items-center justify-center gap-1.5 rounded-xl bg-secondary font-semibold text-[15px] text-primary'
          href={`/plan?date=${selectedDate}`}
        >
          <IconPlus aria-hidden='true' className='size-4.5' strokeWidth={2.4} />
          予定
        </Link>
      </div>

      <TodoChips memos={initial.memos} />

      <div className='mt-1 flex items-center'>
        <h2 className='font-semibold text-[17px]'>
          {formatDateWithWeekdayJst(selectedDate)}
        </h2>
        <Link
          className='ml-auto font-semibold text-primary text-sm'
          href='/records'
        >
          すべての記録
        </Link>
      </div>

      <DayDetailList
        daySum={daySums.get(selectedDate)}
        plans={selectDayPlans(month.plans, selectedDate)}
        reminders={selectDayReminders(month.reminders, selectedDate)}
      />
    </div>
  );
}

function MonthNavButton({
  direction,
  isPending,
  onClick
}: {
  direction: 'prev' | 'next';
  isPending: boolean;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={direction === 'prev' ? '前の月' : '次の月'}
      className='flex size-9 items-center justify-center rounded-full bg-card text-foreground disabled:opacity-50'
      disabled={isPending}
      onClick={onClick}
      type='button'
    >
      <IconChevronLeft
        aria-hidden='true'
        className={`size-4.5 ${direction === 'next' ? 'rotate-180' : ''}`}
        strokeWidth={2.4}
      />
    </button>
  );
}
