'use client';

import { ja } from 'date-fns/locale';
import type { ComponentProps } from 'react';
import { getDefaultClassNames } from 'react-day-picker';
import { Calendar } from '@/components/ui/calendar';

// 任意の日を選ぶ暦（README D8）。デザインには暦の見た目が無いので、shadcn の
// Calendar（react-day-picker）をトークンで塗ったものを、該当行の直下に展開して使う。
//
// 選択はアクセント、日曜は削除色、土曜は土曜色、角丸 12。マスは 44px でタップ領域を確保する。

const defaultClassNames = getDefaultClassNames();

// react-day-picker のナビゲーションラベルは locale を渡しても英語のままなので、
// 読み上げ用に日本語を当てる。
const calendarJaProps = {
  locale: ja,
  labels: {
    labelPrevious: () => '前の月',
    labelNext: () => '次の月'
  }
};

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
