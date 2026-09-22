'use client';

import Link from 'next/link';
import { useMemo, useState, useTransition } from 'react';
import { MonthJumpPicker } from '@/components/month-jump-picker';
import { Button, buttonVariants } from '@/components/ui/button';
import { MemoList } from '@/features/memo-shortcut';
import { getCalendarMonthAction } from '../actions';
import {
  type AllRecordsOrder,
  nextAllRecordsOrder,
  selectAllRecordDays
} from '../domain/all-records';
import { formatMonthSum } from '../domain/format';
import { monthLabel, shiftMonth } from '../domain/period';
import { calendarLabels } from '../labels';
import type {
  CalendarEvent,
  CalendarInitialData,
  CalendarMonthData
} from '../types';
import { useSwipe } from '../use-swipe';
import { AllRecordsList, DayRecordList } from './day-record-list';
import { EventDetail } from './event-detail';
import { MonthCalendar } from './month-calendar';
import { ShortcutRecordList } from './shortcut-record-list';

// カレンダー統合画面（ホーム）の Client 統合。
// SSR で解決した初期データ（当月）を受け取り、月移動時のみ Server Action で再取得する。
// 表示は純粋読み取り（副作用 INSERT なし）。TODO 追加/削除は memo-shortcut の MemoList、
// ショートカット記録は ShortcutRecordList（calendar 所有 Action）が担う。
//
// イベントクリック: plan / reminder をクリックすると EventDetail に詳細カードを出す。
// 通常 plan は「編集」で /plan?planId= へ、リマインダー由来 plan はその場で削除できる。
// 日付クリック・月移動で選択は解除する。

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
  // 全記録一覧の並び（null=選択日1日表示 / 'desc' or 'asc'=当月全記録）。
  const [allRecordsOrder, setAllRecordsOrder] = useState<AllRecordsOrder>(null);
  const [isPending, startTransition] = useTransition();

  // 選択日の DaySum（records / holiday）を月データから引く。
  const selectedDay = useMemo(
    () => month.days.find((day) => day.dateStr === selectedDate) ?? null,
    [month.days, selectedDate]
  );

  // 選択イベントの実体（plan / reminder）を月データから引く。
  // イベントは planId か reminderId のどちらかを持つ。
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

  // 当月の全記録（記録のある日のみ・並び順は allRecordsOrder）。
  // フィルタ・並べ替えは selectAllRecordDays（純粋関数）に集約する。
  const allRecordDays = useMemo(
    () =>
      allRecordsOrder === null
        ? []
        : selectAllRecordDays(month.days, month.yearMonth, allRecordsOrder),
    [allRecordsOrder, month.days, month.yearMonth]
  );

  // 日付を選び直したらイベント詳細・全記録表示は閉じる。
  const handleDateClick = (dateStr: string) => {
    setSelectedDate(dateStr);
    setSelectedEvent(null);
    setAllRecordsOrder(null);
  };

  // plan / reminder クリック → 詳細カードを開き、選択日をイベント日に寄せる。
  const handleEventClick = (event: CalendarEvent) => {
    setSelectedDate(event.start);
    setSelectedEvent({ planId: event.planId, reminderId: event.reminderId });
    setAllRecordsOrder(null);
  };

  // 全記録一覧のトグル（初回 DESC → 再押下で ASC/DESC を交互）。
  const toggleAllRecords = () => {
    setSelectedEvent(null);
    setAllRecordsOrder(nextAllRecordsOrder);
  };

  const handleMonthChange = (yearMonth: string) => {
    startTransition(async () => {
      const next = await getCalendarMonthAction(yearMonth);
      setMonth(next);
      // 月が変わったら選択日・イベント詳細・全記録表示をクリアする（前月の選択を持ち越さない）。
      setSelectedDate(null);
      setSelectedEvent(null);
      setAllRecordsOrder(null);
    });
  };

  const move = (delta: number) =>
    handleMonthChange(shiftMonth(month.yearMonth, delta));

  // 左右スワイプで前月/次月へ。
  // FullCalendar 自体はタッチを日付選択に使うため、カレンダー領域を含む外側のヘッダー
  // コンテナに結線する（グリッド内タップとの競合を避ける）。
  const swipe = useSwipe({
    onSwipeLeft: () => move(1),
    onSwipeRight: () => move(-1)
  });

  return (
    <div className='mx-auto flex w-full max-w-md flex-col gap-4 p-4'>
      <header className='flex flex-col gap-2'>
        <h1 className='font-bold text-lg'>{calendarLabels.heading.title}</h1>
        {/* 前月/次月 ＋ 中央に年月ジャンプ ＋ 月収支サブタイトル。 */}
        <div className='flex items-center justify-between gap-2'>
          <Button
            type='button'
            variant='outline'
            size='sm'
            onClick={() => move(-1)}
            disabled={isPending}
            aria-label='前月'
          >
            ＜
          </Button>
          <div className='flex flex-col items-center'>
            <MonthJumpPicker
              yearMonth={month.yearMonth}
              label={monthLabel(month.yearMonth)}
              onSelect={handleMonthChange}
            />
            <span className='text-muted-foreground text-xs'>
              {calendarLabels.heading.monthSum}：
              {formatMonthSum(month.monthSum)} 円
            </span>
          </div>
          <Button
            type='button'
            variant='outline'
            size='sm'
            onClick={() => move(1)}
            disabled={isPending}
            aria-label='次月'
          >
            ＞
          </Button>
        </div>
      </header>

      <div
        data-pending={isPending}
        className='data-[pending=true]:opacity-60'
        onTouchStart={swipe.onTouchStart}
        onTouchEnd={swipe.onTouchEnd}
      >
        <MonthCalendar
          data={month}
          selectedDate={selectedDate}
          onDateClick={handleDateClick}
          onEventClick={handleEventClick}
        />
      </div>

      <div className='flex items-center gap-2'>
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
        {/* 当月の全記録を昇順/降順トグルで一覧。 */}
        <Button
          type='button'
          variant='outline'
          size='sm'
          className='ml-auto'
          onClick={toggleAllRecords}
          aria-pressed={allRecordsOrder !== null}
        >
          {allRecordsLabel(allRecordsOrder)}
        </Button>
      </div>

      {/* 表示は排他: ①全記録一覧（トグル ON） ②イベント詳細（plan/reminder 選択）
          ③選択日の記録一覧。 */}
      {allRecordsOrder !== null ? (
        <AllRecordsList days={allRecordDays} />
      ) : selectedPlan || selectedReminder ? (
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

// 全記録トグルのボタン文言（OFF=通常 / 降順=↓ / 昇順=↑）。
function allRecordsLabel(order: AllRecordsOrder): string {
  const base = calendarLabels.action.showAllRecords;
  if (order === null) {
    return base;
  }
  return order === 'desc' ? `${base} ↓` : `${base} ↑`;
}
