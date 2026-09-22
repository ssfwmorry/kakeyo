'use client';

import Link from 'next/link';
import { useMemo, useState, useTransition } from 'react';
import { buttonVariants } from '@/components/ui/button';
import { MemoList } from '@/features/memo-shortcut';
import { getCalendarMonthAction } from '../actions';
import { formatMonthSum } from '../domain/format';
import { calendarLabels } from '../labels';
import type { CalendarInitialData, CalendarMonthData } from '../types';
import { DayRecordList } from './day-record-list';
import { MonthCalendar } from './month-calendar';
import { ShortcutRecordList } from './shortcut-record-list';

// カレンダー統合画面（ホーム）の Client 統合。旧 pages/calendar.vue 相当。
// SSR で解決した初期データ（当月）を受け取り、月移動時のみ Server Action で再取得する。
// 表示は純粋読み取り（副作用 INSERT なし）。TODO 追加/削除は memo-shortcut の MemoList、
// ショートカット記録は ShortcutRecordList（calendar 所有 Action）が担う。
//
// 段階実装の TODO（表示優先の方針に従う）:
// - plan / reminder イベントのクリック編集・削除（onEventClick で id は拾えるが編集
//   導線は未接続）。plan-reminder の deletePlanAction 等は barrel 非公開のため、
//   公開点の追加が必要になったら別レーンで対応する。
// - record カードの個別編集遷移（/note に record 編集の受け口が無いため未接続）。

export function CalendarScreen({ initial }: { initial: CalendarInitialData }) {
  const [month, setMonth] = useState<CalendarMonthData>(initial.month);
  const [selectedDate, setSelectedDate] = useState<string | null>(
    initial.today
  );
  const [isPending, startTransition] = useTransition();

  // 選択日の DaySum（records / holiday）を月データから引く。
  const selectedDay = useMemo(
    () => month.days.find((day) => day.dateStr === selectedDate) ?? null,
    [month.days, selectedDate]
  );

  const handleMonthChange = (yearMonth: string) => {
    startTransition(async () => {
      const next = await getCalendarMonthAction(yearMonth);
      setMonth(next);
      // 月が変わったら選択日をクリアする（前月の日を選んだままにしない）。
      setSelectedDate(null);
    });
  };

  return (
    <div className='mx-auto flex w-full max-w-md flex-col gap-4 p-4'>
      <header className='flex flex-col gap-1'>
        <h1 className='font-bold text-lg'>{calendarLabels.heading.title}</h1>
        <p className='text-muted-foreground text-sm'>
          {calendarLabels.heading.monthSum}：{formatMonthSum(month.monthSum)} 円
        </p>
      </header>

      <div data-pending={isPending} className='data-[pending=true]:opacity-60'>
        <MonthCalendar
          data={month}
          selectedDate={selectedDate}
          onDateClick={setSelectedDate}
          onMonthChange={handleMonthChange}
        />
      </div>

      <div className='flex gap-2'>
        {/* note は日付クエリを受け取らないためプレーンに遷移する（記録の初期日付
            プリフィルは note 側の受け口が無く TODO）。 */}
        <Link href='/note' className={buttonVariants({ variant: 'default' })}>
          {calendarLabels.action.addRecord}
        </Link>
        <Link
          href={selectedDate ? `/plan?date=${selectedDate}` : '/plan'}
          className={buttonVariants({ variant: 'default' })}
        >
          {calendarLabels.action.addPlan}
        </Link>
      </div>

      <DayRecordList
        dateStr={selectedDate}
        records={selectedDay?.records ?? []}
        holidayName={selectedDay?.holidayName ?? null}
      />

      <MemoList items={initial.memos} hasPair={initial.hasPair} />

      {initial.shortcuts.length > 0 ? (
        <ShortcutRecordList items={initial.shortcuts} />
      ) : null}
    </div>
  );
}
