'use client';

import { calendarJaProps } from '@/components/form/date-picker';
import { Calendar } from '@/components/ui/calendar';
import { formatLocalDate, parseLocalDate } from '@/lib/shared/domain/localDate';
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetTitle
} from '@/v2/components/ui/bottom-sheet';

// 「他の日を選ぶ」のシート。3 択のチップに無い日はここから選ぶ。
//
// 暦の部品は既存の shadcn Calendar をそのまま使う。トークンは BottomSheet が
// v2-root を付け直すので新デザインの色で出る。日を選んだら即閉じる（確定ボタンを
// 挟むほどの操作ではない）。

export function DateSheet({
  isOpen,
  onOpenChange,
  value,
  onChange
}: {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  value: string;
  onChange: (date: string) => void;
}) {
  const selected = parseLocalDate(value);

  return (
    <BottomSheet onOpenChange={onOpenChange} open={isOpen}>
      <BottomSheetContent>
        <BottomSheetTitle>日付を選ぶ</BottomSheetTitle>
        <div className='flex justify-center rounded-2xl bg-card py-2'>
          <Calendar
            {...calendarJaProps}
            autoFocus
            className='bg-transparent'
            defaultMonth={selected}
            mode='single'
            onSelect={(next) => {
              // 同じ日を押すと undefined が来る（選択解除）。日付は必須なので無視する。
              if (next === undefined) {
                return;
              }
              onChange(formatLocalDate(next));
              onOpenChange(false);
            }}
            selected={selected}
          />
        </div>
      </BottomSheetContent>
    </BottomSheet>
  );
}
