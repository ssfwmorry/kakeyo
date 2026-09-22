'use client';

import Link from 'next/link';
import { useMemo, useState, useTransition } from 'react';
import { buttonVariants } from '@/components/ui/button';
import { MemoList } from '@/features/memo-shortcut';
import { getCalendarMonthAction } from '../actions';
import { formatMonthSum } from '../domain/format';
import { calendarLabels } from '../labels';
import type {
  CalendarEvent,
  CalendarInitialData,
  CalendarMonthData
} from '../types';
import { DayRecordList } from './day-record-list';
import { EventDetail } from './event-detail';
import { MonthCalendar } from './month-calendar';
import { ShortcutRecordList } from './shortcut-record-list';

// カレンダー統合画面（ホーム）の Client 統合。旧 pages/calendar.vue 相当。
// SSR で解決した初期データ（当月）を受け取り、月移動時のみ Server Action で再取得する。
// 表示は純粋読み取り（副作用 INSERT なし）。TODO 追加/削除は memo-shortcut の MemoList、
// ショートカット記録は ShortcutRecordList（calendar 所有 Action）が担う。
//
// イベントクリック（旧 showEvent 相当）: plan / reminder をクリックすると EventDetail に
// 詳細カードを出す。通常 plan は「編集」で /plan?planId= へ、リマインダー由来 plan は
// その場で削除できる（旧 PlanCard/ReminderCard の導線を移植）。日付クリック・月移動で
// 選択は解除する（旧: selectedDate 変更時に selectedPlan/Reminder を null 化）。
//
// record カードの個別編集遷移は day-record-list 側で /note?RECORD= へ接続済み。

export function CalendarScreen({ initial }: { initial: CalendarInitialData }) {
  const [month, setMonth] = useState<CalendarMonthData>(initial.month);
  const [selectedDate, setSelectedDate] = useState<string | null>(
    initial.today
  );
  // クリックされたイベントの参照 id（plan / reminder）。両 null なら詳細カード非表示。
  const [selectedEvent, setSelectedEvent] = useState<{
    planId: number | null;
    reminderId: number | null;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  // 選択日の DaySum（records / holiday）を月データから引く。
  const selectedDay = useMemo(
    () => month.days.find((day) => day.dateStr === selectedDate) ?? null,
    [month.days, selectedDate]
  );

  // 選択イベントの実体（plan / reminder）を月データから引く。
  // イベントは planId か reminderId のどちらかを持つ（events.ts の kind に対応）。
  const selectedPlan = useMemo(
    () =>
      selectedEvent?.planId == null
        ? null
        : (month.plans.find((plan) => plan.id === selectedEvent.planId) ??
          null),
    [month.plans, selectedEvent]
  );
  const selectedReminder = useMemo(
    () =>
      selectedEvent?.reminderId == null || selectedEvent.planId != null
        ? null
        : (month.reminders.find(
            (reminder) => reminder.id === selectedEvent.reminderId
          ) ?? null),
    [month.reminders, selectedEvent]
  );

  // 日付を選び直したらイベント詳細は閉じる（旧 showDateRecords の挙動）。
  const handleDateClick = (dateStr: string) => {
    setSelectedDate(dateStr);
    setSelectedEvent(null);
  };

  // plan / reminder クリック → 詳細カードを開き、選択日をイベント日に寄せる。
  const handleEventClick = (event: CalendarEvent) => {
    setSelectedDate(event.start);
    setSelectedEvent({ planId: event.planId, reminderId: event.reminderId });
  };

  const handleMonthChange = (yearMonth: string) => {
    startTransition(async () => {
      const next = await getCalendarMonthAction(yearMonth);
      setMonth(next);
      // 月が変わったら選択日・イベント詳細をクリアする（前月の選択を持ち越さない）。
      setSelectedDate(null);
      setSelectedEvent(null);
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
          onDateClick={handleDateClick}
          onEventClick={handleEventClick}
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

      {/* イベント選択中は詳細カードを、そうでなければ選択日の記録一覧を出す
          （旧 calendar.vue は showEvent 時に selectedDateRecords を空にして排他）。 */}
      {selectedPlan || selectedReminder ? (
        <EventDetail
          plan={selectedPlan}
          reminder={selectedReminder}
          onClose={() => setSelectedEvent(null)}
        />
      ) : (
        <DayRecordList
          dateStr={selectedDate}
          records={selectedDay?.records ?? []}
          holidayName={selectedDay?.holidayName ?? null}
        />
      )}

      <MemoList items={initial.memos} hasPair={initial.hasPair} />

      {initial.shortcuts.length > 0 ? (
        <ShortcutRecordList items={initial.shortcuts} />
      ) : null}
    </div>
  );
}
