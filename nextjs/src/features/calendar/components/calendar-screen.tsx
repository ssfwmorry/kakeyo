'use client';

import Link from 'next/link';
import { useMemo, useState, useTransition } from 'react';
import { MonthJumpPicker } from '@/components/month-jump-picker';
import { Button, buttonVariants } from '@/components/ui/button';
import { useSwipe } from '@/components/use-swipe';
import { MemoList } from '@/features/memo-shortcut';
import type { PlanItem, ReminderItem } from '@/features/plan-reminder';
import { formatDateWithWeekdayJst } from '@/lib/shared/domain/date';
import { getCalendarMonthAction } from '../actions';
import {
  type AllRecordsOrder,
  nextAllRecordsOrder,
  selectAllRecordDays
} from '../domain/all-records';
import { selectDayPlans, selectDayReminders } from '../domain/day-events';
import { formatMonthSum } from '../domain/format';
import { monthLabel, shiftMonth } from '../domain/period';
import { calendarLabels } from '../labels';
import type {
  CalendarEvent,
  CalendarInitialData,
  CalendarMonthData,
  DaySum
} from '../types';

import { DayPlanList } from './day-plan-list';
import { AllRecordsList, DayRecordList } from './day-record-list';
import { MonthCalendar } from './month-calendar';
import { ShortcutRecordList } from './shortcut-record-list';

// カレンダー統合画面（ホーム）の Client 統合。
// SSR で解決した初期データ（当月）を受け取り、月移動時のみ Server Action で再取得する。
// 表示は純粋読み取り（副作用 INSERT なし）。TODO 追加/削除は memo-shortcut の MemoList、
// ショートカット記録は ShortcutRecordList（calendar 所有 Action）が担う。
//
// この画面の仕事は 3 つ: 予定を確かめる・TODO を足す・記録を残す。上から順に
//  1. 月グリッド: 日ごとの収支と予定バーを一望する。日付やバーを押すと下の日パネルが
//     その日に切り替わる。
//  2. 追加導線: 「記録を追加」「予定を追加」。
//  3. TODO 帯（MemoList）。
//  4. 日パネル: 選択日の予定（全文）と記録。見出し右の「全ての記録」で当月の全記録一覧に
//     切り替わる。
//
// 高さ設計: 各セクションは内容の高さで積み、固定枠や内側スクロールは持たない
// （画面に収まらない分は main 側のスクロールに任せる）。
// ページ見出し h1 は持たない（ボトムナビが「カレンダー」を名乗っている）。

export function CalendarScreen({ initial }: { initial: CalendarInitialData }) {
  const [month, setMonth] = useState<CalendarMonthData>(initial.month);
  const [selectedDate, setSelectedDate] = useState<string | null>(
    initial.today
  );
  // 全記録一覧の並び（null=選択日の日パネル / 'desc' or 'asc'=当月全記録）。
  const [allRecordsOrder, setAllRecordsOrder] = useState<AllRecordsOrder>(null);
  const [isPending, startTransition] = useTransition();

  // 選択日の DaySum（records / holiday）を月データから引く。
  const selectedDay = useMemo(
    () => month.days.find((day) => day.dateStr === selectedDate) ?? null,
    [month.days, selectedDate]
  );

  // 選択日にかかる予定・リマインダー（純粋関数で絞る）。
  const dayPlans = useMemo(
    () =>
      selectedDate === null ? [] : selectDayPlans(month.plans, selectedDate),
    [month.plans, selectedDate]
  );
  const dayReminders = useMemo(
    () =>
      selectedDate === null
        ? []
        : selectDayReminders(month.reminders, selectedDate),
    [month.reminders, selectedDate]
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

  // 日付を選び直したら全記録表示は閉じる。
  const handleDateClick = (dateStr: string) => {
    setSelectedDate(dateStr);
    setAllRecordsOrder(null);
  };

  // plan / reminder のバーを押したら、押したセルの日を選ぶ（日パネルに全文が出る）。
  const handleEventClick = (_event: CalendarEvent, clickedDate: string) =>
    handleDateClick(clickedDate);

  // 全記録一覧のトグル（初回 DESC → 再押下で ASC/DESC を交互）。
  const toggleAllRecords = () => setAllRecordsOrder(nextAllRecordsOrder);

  const handleMonthChange = (yearMonth: string) => {
    startTransition(async () => {
      const next = await getCalendarMonthAction(yearMonth);
      setMonth(next);
      // 月が変わったら選択日・全記録表示をクリアする（前月の選択を持ち越さない）。
      setSelectedDate(null);
      setAllRecordsOrder(null);
    });
  };

  const move = (delta: number) =>
    handleMonthChange(shiftMonth(month.yearMonth, delta));

  // 左右スワイプで前月/次月へ。
  // FullCalendar 自体はタッチを日付選択に使うため、カレンダー領域を含む外側の
  // コンテナに結線する（グリッド内タップとの競合を避ける）。
  const swipe = useSwipe({
    onSwipeLeft: () => move(1),
    onSwipeRight: () => move(-1)
  });

  return (
    <div className='flex flex-col gap-3 px-4 pt-2 pb-4'>
      {/* 前月/次月・年月ジャンプ・月収支を 1 行に畳む（見出し h1 は持たない）。
          月収支はこの行で唯一の数字なので、ラベルより一段強く出す。 */}
      <header className='flex items-center gap-1'>
        <Button
          type='button'
          variant='ghost'
          size='icon-sm'
          onClick={() => move(-1)}
          disabled={isPending}
          aria-label={calendarLabels.action.prevMonth}
        >
          ＜
        </Button>
        <MonthJumpPicker
          yearMonth={month.yearMonth}
          label={monthLabel(month.yearMonth)}
          onSelect={handleMonthChange}
        />
        <Button
          type='button'
          variant='ghost'
          size='icon-sm'
          onClick={() => move(1)}
          disabled={isPending}
          aria-label={calendarLabels.action.nextMonth}
        >
          ＞
        </Button>
        <span className='ml-auto flex items-baseline gap-1.5'>
          <span className='text-muted-foreground text-xs'>
            {calendarLabels.heading.monthSum}
          </span>
          <span className='font-medium text-sm tabular-nums'>
            {formatMonthSum(month.monthSum)} 円
          </span>
        </span>
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

      {/* 追加導線。グリッドの直下に固定で置き、下の帯やリストの長さに左右されない。 */}
      <AddLinks selectedDate={selectedDate} />

      <MemoList items={initial.memos} hasPair={initial.hasPair} />

      <DayPane
        allRecordsOrder={allRecordsOrder}
        allRecordDays={allRecordDays}
        selectedDate={selectedDate}
        selectedDay={selectedDay}
        plans={dayPlans}
        reminders={dayReminders}
        onToggleAllRecords={toggleAllRecords}
      />

      {initial.shortcuts.length > 0 ? (
        <ShortcutRecordList items={initial.shortcuts} />
      ) : null}
    </div>
  );
}

// 日パネル（見出し行 + 本体）。本体は排他:
// ①全記録一覧（トグル ON） ②選択日の予定＋記録。
// 状態は持たず、親から渡された選択結果を並べるだけ。
function DayPane({
  allRecordsOrder,
  allRecordDays,
  selectedDate,
  selectedDay,
  plans,
  reminders,
  onToggleAllRecords
}: {
  allRecordsOrder: AllRecordsOrder;
  allRecordDays: { dateStr: string; records: DaySum['records'] }[];
  selectedDate: string | null;
  selectedDay: DaySum | null;
  plans: PlanItem[];
  reminders: ReminderItem[];
  onToggleAllRecords: () => void;
}) {
  const isAllRecords = allRecordsOrder !== null;

  return (
    <section className='flex flex-col gap-2'>
      <div className='flex items-center gap-2'>
        <h2 className='font-bold text-sm'>
          {paneHeading(allRecordsOrder, selectedDate)}
        </h2>
        {/* 祝日名は日付と不可分なので見出しの隣に添える。 */}
        {!isAllRecords && selectedDay?.holidayName ? (
          <span className='rounded bg-red-100 px-1.5 py-0.5 text-red-700 text-xs'>
            {selectedDay.holidayName}
          </span>
        ) : null}
        {/* 当月の全記録を昇順/降順トグルで一覧。 */}
        <Button
          type='button'
          variant={isAllRecords ? 'secondary' : 'ghost'}
          size='xs'
          className='ml-auto'
          onClick={onToggleAllRecords}
          aria-pressed={isAllRecords}
        >
          {allRecordsLabel(allRecordsOrder)}
        </Button>
      </div>

      {isAllRecords ? (
        <AllRecordsList days={allRecordDays} />
      ) : (
        <DayBody
          selectedDate={selectedDate}
          records={selectedDay?.records ?? []}
          plans={plans}
          reminders={reminders}
        />
      )}
    </section>
  );
}

// 選択日の予定＋記録。空表示は子リストに任せず、予定も記録も無いときだけここで 1 行出す。
function DayBody({
  selectedDate,
  records,
  plans,
  reminders
}: {
  selectedDate: string | null;
  records: DaySum['records'];
  plans: PlanItem[];
  reminders: ReminderItem[];
}) {
  const isEmpty =
    plans.length === 0 && reminders.length === 0 && records.length === 0;
  return (
    <>
      <DayPlanList plans={plans} reminders={reminders} />
      <DayRecordList records={records} />
      {selectedDate !== null && isEmpty ? (
        <p className='text-muted-foreground text-sm'>
          {calendarLabels.empty.day}
        </p>
      ) : null}
    </>
  );
}

// 追加導線。選択日があれば初期日付として渡す（月移動直後など未選択なら日付なしで遷移）。
// 毎日使う「記録」を塗り、「予定」は枠線にして主従を付ける。
function AddLinks({ selectedDate }: { selectedDate: string | null }) {
  const query = selectedDate ? `?date=${selectedDate}` : '';
  return (
    <div className='grid grid-cols-2 gap-2'>
      <Link
        href={`/note${query}`}
        className={buttonVariants({ variant: 'default' })}
      >
        ＋ {calendarLabels.action.addRecord}
      </Link>
      <Link
        href={`/plan${query}`}
        className={buttonVariants({ variant: 'default' })}
      >
        ＋ {calendarLabels.action.addPlan}
      </Link>
    </div>
  );
}

// 日パネルの見出し。全記録トグル ON なら月見出し、選択日があればその日付（曜日付き）、
// どちらでもなければ汎用の「記録」。
function paneHeading(
  order: AllRecordsOrder,
  selectedDate: string | null
): string {
  if (order !== null) {
    return calendarLabels.heading.monthRecords;
  }
  return selectedDate === null
    ? calendarLabels.heading.dayRecords
    : formatDateWithWeekdayJst(selectedDate);
}

// 全記録トグルのボタン文言（OFF=通常 / 降順=↓ / 昇順=↑）。
function allRecordsLabel(order: AllRecordsOrder): string {
  const base = calendarLabels.action.showAllRecords;
  if (order === null) {
    return base;
  }
  return order === 'desc' ? `${base} ↓` : `${base} ↑`;
}
