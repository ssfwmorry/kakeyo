'use client';

import { ja } from 'date-fns/locale';
import { useState } from 'react';
import { IconCalendar } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { formatDateWithWeekdayJst } from '@/lib/shared/domain/date';
import { formatLocalDate, parseLocalDate } from '@/lib/shared/domain/localDate';

// 暦日（YYYY-MM-DD）を選ぶピッカー（MonthJumpPicker が「年月」なのに対し「日」まで）。
// 出し入れは暦日の文字列で行い、Date はこのファイルの中だけに閉じる
// （tz を持つ値を呼び出し側へ漏らさない）。

// Calendar を出す全画面で共通の日本語化。react-day-picker のナビゲーションラベルは
// locale を渡しても英語のままなので、読み上げ用に日本語を当てる。
export const calendarJaProps = {
  locale: ja,
  labels: {
    labelPrevious: () => '前の月',
    labelNext: () => '次の月'
  }
};

type DatePickerProps = {
  // 選択中の暦日（YYYY-MM-DD）。
  value: string;
  onChange: (date: string) => void;
  // トリガーに付ける id（Label の htmlFor 用）。
  id?: string;
  // トリガーの aria-label（可視ラベルを持たない置き方をするため必須）。
  ariaLabel: string;
};

export function DatePicker({
  value,
  onChange,
  id,
  ariaLabel
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const label = formatDateWithWeekdayJst(value);
  const selected = parseLocalDate(value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            id={id}
            type='button'
            variant='outline'
            size='lg'
            aria-label={`${ariaLabel}: ${label}`}
          />
        }
      >
        <IconCalendar className='text-muted-foreground' aria-hidden />
        <span className='tabular-nums'>{label}</span>
      </PopoverTrigger>
      <PopoverContent className='w-auto p-0' align='end'>
        <Calendar
          mode='single'
          {...calendarJaProps}
          selected={selected}
          defaultMonth={selected}
          autoFocus
          onSelect={(next) => {
            // 同じ日を押すと undefined が来る（選択解除）。日付は必須なので無視する。
            if (next === undefined) {
              return;
            }
            onChange(formatLocalDate(next));
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
