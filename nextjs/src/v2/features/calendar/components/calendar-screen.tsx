'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition
} from 'react';
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
import type { GroupedPlanTypeList, PlanItem } from '@/features/plan-reminder';
import type { NoteRecordDefault } from '@/features/record';
import type {
  GroupedMethodList,
  GroupedTypeList
} from '@/features/type-method';
import { PairModeSegment } from '@/v2/components/pair-mode-segment';
import { ThemeToggle } from '@/v2/components/theme-toggle';
import { RecordSheet } from '@/v2/features/note/components/record-sheet';
import { NotifySheetStateProvider } from '@/v2/features/notify/components/notify-sheet-state';
import { PlanSheet } from '@/v2/features/plan/components/plan-sheet';
import { formatMonthDayWeekJa, formatSignedPrice } from '@/v2/lib/format';
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
//
// お知らせシートの開閉はこの画面が持つ。ヘッダーのベルと日別リストのリマインダー行の
// 両方から同じシートを開くため。

// セルに出す帯の段数。3 段以上入れると 1 マスが高くなりすぎて月が見渡せない。
const MAX_LANES = 2;

// 予定シート。追加は選択日を初期値に、編集は対象の予定を持って開く。
type PlanSheetState =
  | { kind: 'closed' }
  | { kind: 'create' }
  | { kind: 'edit'; plan: PlanItem };

// 記録シート。追加は選択日を初期値に、編集は対象の記録を持って開く。
type RecordSheetState =
  | { kind: 'closed' }
  | { kind: 'create' }
  | { kind: 'edit'; record: NoteRecordDefault };

// タブバーの ＋ はどの画面からでも記録を追加できるよう、このクエリ付きでカレンダーへ来る。
const NOTE_QUERY = 'note';

export function CalendarScreen({
  initial,
  planTypeList,
  typeList,
  methodList,
  headerLeft
}: {
  initial: CalendarInitialData;
  planTypeList: GroupedPlanTypeList;
  typeList: GroupedTypeList;
  methodList: GroupedMethodList;
  // ヘッダー左に置く要素（お知らせのベル）。Server Component を page から渡す。
  headerLeft?: ReactNode;
}) {
  const [month, setMonth] = useState<CalendarMonthData>(initial.month);
  const [selectedDate, setSelectedDate] = useState(initial.today);
  const [isPending, startTransition] = useTransition();
  const [planSheet, setPlanSheet] = useState<PlanSheetState>({
    kind: 'closed'
  });
  const [recordSheet, setRecordSheet] = useState<RecordSheetState>({
    kind: 'closed'
  });

  // ?note=new で来たら記録シートを開き、クエリは消す（更新やブラウザバックで
  // また開かないように）。history.replaceState では Next のルーター側に古い URL が
  // 残り、Server Action 後の再検証で ?note=new が戻ってくるので router.replace で消す。
  const router = useRouter();
  const searchParams = useSearchParams();
  const shouldOpenNote = searchParams.get(NOTE_QUERY) === 'new';
  useEffect(() => {
    if (!shouldOpenNote) {
      return;
    }
    setRecordSheet({ kind: 'create' });
    router.replace('/v2/calendar', { scroll: false });
  }, [shouldOpenNote, router]);

  // 記録・予定を保存・削除したら、いま見ている月を取り直す。月データはこの画面の state
  // なので、サーバ側の再検証だけでは画面に反映されない。
  const reloadMonth = useCallback(() => {
    startTransition(async () => {
      setMonth(await getCalendarMonthAction(month.yearMonth));
    });
  }, [month.yearMonth]);

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
    <NotifySheetStateProvider>
      <div className='flex flex-col gap-3 px-4'>
        <div className='flex h-11 items-center justify-between'>
          <span>{headerLeft}</span>
          <div className='flex items-center gap-1.5'>
            <ThemeToggle />
            <PairModeSegment
              hasPair={initial.hasPair}
              isPair={initial.isPair}
            />
          </div>
        </div>

        <div className='flex items-center gap-2'>
          <h1 className='font-bold text-3xl'>{Number(monthPart)}月</h1>
          <span className='mt-1.5 text-[17px] text-muted-foreground'>
            {year}
          </span>
          <span className='mt-2 flex items-baseline gap-1'>
            <span className='text-muted-foreground text-xs'>収支</span>
            {/* monthSum は「支出=正」向きなので符号を反転して出す。色は符号によらず本文色。 */}
            <span className='font-semibold text-[15px]'>
              {formatSignedPrice(Math.abs(month.monthSum), month.monthSum > 0)}
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
        />

        <div className='grid grid-cols-2 gap-2.5'>
          <button
            className='flex h-11 items-center justify-center gap-1.5 rounded-xl bg-primary font-semibold text-[15px] text-primary-foreground'
            onClick={() => setRecordSheet({ kind: 'create' })}
            type='button'
          >
            <IconPlus
              aria-hidden='true'
              className='size-4.5'
              strokeWidth={2.4}
            />
            記録
          </button>
          <button
            className='flex h-11 items-center justify-center gap-1.5 rounded-xl bg-secondary font-semibold text-[15px] text-primary'
            onClick={() => setPlanSheet({ kind: 'create' })}
            type='button'
          >
            <IconPlus
              aria-hidden='true'
              className='size-4.5'
              strokeWidth={2.4}
            />
            予定
          </button>
        </div>

        <TodoChips hasPair={initial.hasPair} memos={initial.memos} />

        {/* 「すべての記録」への導線はデザインが無いので出さない（README D10）。 */}
        <h2 className='mt-1 font-semibold text-[17px]'>
          {formatMonthDayWeekJa(selectedDate)}
        </h2>

        <DayDetailList
          daySum={daySums.get(selectedDate)}
          onEditPlan={(plan) => setPlanSheet({ kind: 'edit', plan })}
          onEditRecord={(record) => setRecordSheet({ kind: 'edit', record })}
          plans={selectDayPlans(month.plans, selectedDate)}
          reminders={selectDayReminders(month.reminders, selectedDate)}
        />

        {recordSheet.kind === 'closed' ? null : (
          <RecordSheet
            editing={
              recordSheet.kind === 'edit' ? recordSheet.record : undefined
            }
            hasPair={initial.hasPair}
            initialDate={selectedDate}
            // 共有か個人かは作成時に決まる。編集は対象に合わせ、候補もその側を出す。
            isPair={
              recordSheet.kind === 'edit'
                ? recordSheet.record.isPair
                : initial.isPair
            }
            // 編集対象ごとにシートを作り直す。
            key={recordSheet.kind === 'edit' ? recordSheet.record.id : 'create'}
            methodList={methodList}
            onOpenChange={(isOpen) => {
              if (!isOpen) {
                setRecordSheet({ kind: 'closed' });
              }
            }}
            onSaved={reloadMonth}
            shortcuts={initial.shortcuts}
            today={initial.today}
            typeList={typeList}
          />
        )}

        <CalendarPlanSheet
          initialDate={selectedDate}
          isPairMode={initial.isPair}
          onClose={() => setPlanSheet({ kind: 'closed' })}
          onSaved={reloadMonth}
          planTypeList={planTypeList}
          state={planSheet}
        />
      </div>
    </NotifySheetStateProvider>
  );
}

// 予定シートの出し分け。共有か個人かは作成時に決まるので、編集は対象に合わせ、
// カテゴリの候補もその側を出す。
function CalendarPlanSheet({
  state,
  planTypeList,
  isPairMode,
  initialDate,
  onClose,
  onSaved
}: {
  state: PlanSheetState;
  planTypeList: GroupedPlanTypeList;
  isPairMode: boolean;
  initialDate: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  if (state.kind === 'closed') {
    return null;
  }
  const plan = state.kind === 'edit' ? state.plan : undefined;
  const isPair = plan?.isPair ?? isPairMode;
  return (
    <PlanSheet
      initialDate={initialDate}
      isPair={isPair}
      // 編集対象ごとにフォームを作り直す。
      key={plan?.id ?? 'create'}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          onClose();
        }
      }}
      onSaved={onSaved}
      plan={plan}
      planTypes={isPair ? planTypeList.pair : planTypeList.self}
    />
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
