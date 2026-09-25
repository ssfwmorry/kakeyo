'use client';

import type { ComponentProps } from 'react';
import { getDefaultClassNames } from 'react-day-picker';
import { calendarJaProps } from '@/components/form/date-picker';
import { Calendar } from '@/components/ui/calendar';

// 任意の日を選ぶ暦（README D8）。デザインには暦の見た目が無いので、既存の
// react-day-picker を v2 のトークンで塗ったものを、該当行の直下に展開して使う。
//
// 選択はアクセント、日曜は削除色、土曜は土曜色、角丸 12。マスは 44px でタップ領域を確保する。

const defaultClassNames = getDefaultClassNames();

export function InlineCalendar(props: ComponentProps<typeof Calendar>) {
  return (
    <Calendar
      {...calendarJaProps}
      autoFocus
      className='bg-transparent [--cell-radius:12px] [--cell-size:--spacing(11)]'
      classNames={{
        weekdays: `flex [&>th:first-child]:text-destructive [&>th:last-child]:text-[var(--saturday)] ${defaultClassNames.weekdays}`
      }}
      modifiers={{ sunday: { dayOfWeek: 0 }, saturday: { dayOfWeek: 6 } }}
      modifiersClassNames={{
        sunday: 'text-destructive',
        saturday: 'text-[var(--saturday)]'
      }}
      {...props}
    />
  );
}
