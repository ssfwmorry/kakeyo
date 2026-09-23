'use client';

import Link from 'next/link';
import { useMemo, useState, useTransition } from 'react';
import { MonthJumpPicker } from '@/components/month-jump-picker';
import { Button, buttonVariants } from '@/components/ui/button';
import { useSwipe } from '@/components/use-swipe';
import { MemoList } from '@/features/memo-shortcut';
import type { PlanItem, ReminderItem } from '@/features/plan-reminder';
import { formatDateLabelJst } from '@/lib/shared/domain/date';
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
  CalendarMonthData,
  DaySum
} from '../types';

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
//
// 高さ設計: この画面だけは縦スクロールを極力起こさない（月グリッド・記録・TODO・
// ショートカットが 1 画面に載るため）。そのために
//  - ページ見出し h1 は持たない（ボトムナビが「カレンダー」を名乗っている）
//  - 月ナビと月収支を 1 行に畳む
//  - 月グリッドは flex-1 で残りの高さを食い、下の記録一覧側がスクロールする
//  - TODO は見出しなしの chip 帯にして、記録＋/予定＋ の行のトグルで開閉する

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
  // TODO chip 帯の開閉。既定は開（TODO を見るのに 1 タップ要らない）。
  const [isTodoOpen, setIsTodoOpen] = useState(true);
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
    // 画面いっぱいの縦フレックス。グリッドが余りを食い、下半分だけがスクロールする。
    // h-full ではなく min-h-full（グリッドの下限を割る低い画面では中身が縦に溢れる。
    // h-full だと溢れ分が切れるので、min-h-full にして main 側にスクロールさせる）。
    <div className='flex min-h-full flex-col gap-2 px-4 pt-2 pb-1'>
      {/* 前月/次月・年月ジャンプ・月収支を 1 行に畳む（見出し h1 は持たない）。 */}
      <header className='flex shrink-0 items-center gap-2'>
        <Button
          type='button'
          variant='ghost'
          size='icon-sm'
          onClick={() => move(-1)}
          disabled={isPending}
          aria-label='前月'
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
          aria-label='次月'
        >
          ＞
        </Button>
        <span className='ml-auto text-muted-foreground text-xs'>
          {calendarLabels.heading.monthSum} {formatMonthSum(month.monthSum)} 円
        </span>
      </header>

      {/* 月グリッド。flex-1 で残りの高さを食う。
          min-h は FullCalendar の行が潰れない下限。FullCalendar は 1 週の行に
          約 58px の下限を持ち、これを割ると縮まずに末尾の週をはみ出させる。
          最長の月（6 週）でも切れないよう 6 × 58 + 曜日ヘッダ 25 ≒ 373px を確保する。
          height='100%' の FullCalendar は箱が足りないとスクロールせず末尾の週を
          切り落とすため、下限を割るくらい画面が低いときは flex-1 を諦めてこの
          高さを確保し、代わりに main 側を縦スクロールさせる。 */}
      <div
        data-pending={isPending}
        className='min-h-[373px] flex-1 shrink-0 data-[pending=true]:opacity-60'
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

      {/* カレンダー直下の主操作行。横幅を等分した「押せる面」を並べ、記録＋/予定＋を
          塗り・TODO を outline にして主従を付ける（auto 幅で左に寄せると主従が読めない）。
          全記録の並び替えトグルはここには置かず、操作対象である記録一覧の見出し側に
          持たせている（対象の隣で ↑/↓ の状態が読めるため）。 */}
      <div className='grid shrink-0 grid-cols-3 gap-2'>
        {/* TODO 帯の開閉。TODO セクションの名乗りも兼ねる
            （chip 帯側は見出しを持たない）。件数は開けば数えられるので出さない。 */}
        <Button
          type='button'
          variant={isTodoOpen ? 'secondary' : 'outline'}
          onClick={() => setIsTodoOpen((prev) => !prev)}
          aria-expanded={isTodoOpen}
          aria-controls='calendar-todo'
        >
          {calendarLabels.action.todo}
          <span aria-hidden='true'>{isTodoOpen ? '▴' : '▾'}</span>
        </Button>
        {/* note は日付クエリを受け取らないためプレーンに遷移する（記録の初期日付
            プリフィルは note 側に受け口が無いため未対応）。 */}
        <Link
          href='/note'
          className={buttonVariants({
            variant: 'default',
            className: 'w-full'
          })}
        >
          {calendarLabels.action.addRecord}
        </Link>
        <Link
          href={selectedDate ? `/plan?date=${selectedDate}` : '/plan'}
          className={buttonVariants({
            variant: 'default',
            className: 'w-full'
          })}
        >
          {calendarLabels.action.addPlan}
        </Link>
      </div>

      {isTodoOpen ? (
        <div id='calendar-todo' className='shrink-0'>
          <MemoList items={initial.memos} hasPair={initial.hasPair} />
        </div>
      ) : null}

      {/* 下半分（記録・ショートカット）だけがスクロールする。 */}
      <div className='flex min-h-24 flex-col gap-3 overflow-y-auto'>
        <RecordsPane
          allRecordsOrder={allRecordsOrder}
          allRecordDays={allRecordDays}
          selectedDate={selectedDate}
          selectedDay={selectedDay}
          selectedPlan={selectedPlan}
          selectedReminder={selectedReminder}
          onToggleAllRecords={toggleAllRecords}
          onCloseEvent={() => setSelectedEvent(null)}
        />

        {initial.shortcuts.length > 0 ? (
          <ShortcutRecordList items={initial.shortcuts} />
        ) : null}
      </div>
    </div>
  );
}

// 記録の表示エリア（見出し + 全記録トグル + 本体）。本体の中身は排他:
// ①全記録一覧（トグル ON） ②イベント詳細（plan/reminder 選択） ③選択日の記録一覧。
// 状態は持たず、親から渡された選択結果を並べるだけ。
function RecordsPane({
  allRecordsOrder,
  allRecordDays,
  selectedDate,
  selectedDay,
  selectedPlan,
  selectedReminder,
  onToggleAllRecords,
  onCloseEvent
}: {
  allRecordsOrder: AllRecordsOrder;
  allRecordDays: { dateStr: string; records: DaySum['records'] }[];
  selectedDate: string | null;
  selectedDay: DaySum | null;
  selectedPlan: PlanItem | null;
  selectedReminder: ReminderItem | null;
  onToggleAllRecords: () => void;
  onCloseEvent: () => void;
}) {
  const isAllRecords = allRecordsOrder !== null;

  return (
    <>
      <div className='flex items-center gap-2'>
        <h2 className='font-bold text-sm'>
          {recordsHeading(allRecordsOrder, selectedDate)}
        </h2>
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

      {isAllRecords ? <AllRecordsList days={allRecordDays} /> : null}

      {!isAllRecords && (selectedPlan || selectedReminder) ? (
        <EventDetail
          plan={selectedPlan}
          reminder={selectedReminder}
          onClose={onCloseEvent}
        />
      ) : null}

      {!(isAllRecords || selectedPlan || selectedReminder) ? (
        <DayRecordList
          dateStr={selectedDate}
          records={selectedDay?.records ?? []}
          holidayName={selectedDay?.holidayName ?? null}
        />
      ) : null}
    </>
  );
}

// 記録一覧の見出し。全記録トグル ON なら月見出し、選択日があればその日付、
// どちらでもなければ汎用の「記録」。
function recordsHeading(
  order: AllRecordsOrder,
  selectedDate: string | null
): string {
  if (order !== null) {
    return calendarLabels.heading.monthRecords;
  }
  return selectedDate === null
    ? calendarLabels.heading.dayRecords
    : formatDateLabelJst(selectedDate);
}

// 全記録トグルのボタン文言（OFF=通常 / 降順=↓ / 昇順=↑）。
function allRecordsLabel(order: AllRecordsOrder): string {
  const base = calendarLabels.action.showAllRecords;
  if (order === null) {
    return base;
  }
  return order === 'desc' ? `${base} ↓` : `${base} ↑`;
}
