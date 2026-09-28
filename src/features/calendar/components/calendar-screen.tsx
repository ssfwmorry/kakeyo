'use client';

import {
  type ReactNode,
  useCallback,
  useMemo,
  useState,
  useTransition
} from 'react';
import { IconChevronLeft, IconPlus } from '@/components/icons';
import { PairModeSegment } from '@/components/pair-mode-segment';
import { ThemeToggle } from '@/components/theme-toggle';
import type {
  CalendarInitialData,
  CalendarMonthData,
  DaySum
} from '@/features/calendar';
import { getCalendarMonthAction } from '@/features/calendar/actions';
import {
  selectDayPlans,
  selectDayReminders
} from '@/features/calendar/domain/day-events';
import { shiftMonth } from '@/features/calendar/domain/period';
import { NotifySheetStateProvider } from '@/features/notify/components/notify-sheet-state';
import type { GroupedPlanTypeList, PlanItem } from '@/features/plan-reminder';
import { PlanSheet } from '@/features/plan-reminder/components/plan-sheet';
import type { NoteRecordDefault } from '@/features/record';
import { useNoteModal } from '@/features/record/components/note-modal';
import {
  formatMonthDayWeekJa,
  formatSignedPrice
} from '@/lib/shared/domain/format';
import { assignEventLanes, type LaneEvent } from '../domain/event-lanes';
import { buildMonthGrid } from '../domain/month-grid';
import { DayDetailList } from './day-detail-list';
import { MonthGrid } from './month-grid';
import { TodoChips } from './todo-chips';

// カレンダー（ホーム）。
//
// セルが「日付・収支・予定の帯」の 3 段で帯が複数日にまたがるため、暦ライブラリの
// レイアウトに載せず自前のグリッドで組む（段の割り当ては domain/event-lanes.ts）。
//
// 月移動は Server Action で取り直すが、応答を待たずに見出しとグリッドの枠を先に送る
// （枠は年月だけで決まる）。日別の収支・予定はデータが追いつくまで空にする。前の月の値を
// 残すと新しい枠に古い数字が乗るため。
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

export function CalendarScreen({
  initial,
  planTypeList,
  headerLeft
}: {
  initial: CalendarInitialData;
  planTypeList: GroupedPlanTypeList;
  // ヘッダー左に置く要素（お知らせのベル）。Server Component を page から渡す。
  headerLeft?: ReactNode;
}) {
  // 表示中の年月。月送りではこちらを先に進め、データ（month）は後から追いつかせる。
  // 月見出しとグリッドの枠は年月だけで決まるので、サーバを待たずに描ける。
  const [yearMonth, setYearMonth] = useState(initial.month.yearMonth);
  const [month, setMonth] = useState<CalendarMonthData>(initial.month);
  const [selectedDate, setSelectedDate] = useState(initial.today);
  const [isPending, startTransition] = useTransition();
  const [planSheet, setPlanSheet] = useState<PlanSheetState>({
    kind: 'closed'
  });
  const noteModal = useNoteModal();

  // データが表示中の月に追いつくまでは日別の値を出さない。
  // 出すと新しい月の枠に前月の収支・予定が乗ってしまう。
  const isStale = month.yearMonth !== yearMonth;

  // 月を取り直す。対象の年月を引数で受け、応答が返った時点でまだその月を見ているときだけ
  // 反映する。月を連続で送ると応答の順序が入れ替わることがあり、無条件に入れると表示が
  // 前の月へ巻き戻る。
  const loadMonth = useCallback((target: string) => {
    startTransition(async () => {
      const next = await getCalendarMonthAction(target);
      setMonth((prev) => (next.yearMonth === target ? next : prev));
    });
  }, []);

  // 記録・予定を保存・削除したら、いま見ている月を取り直す。月データはこの画面の state
  // なので、サーバ側の再検証だけでは画面に反映されない。
  const reloadMonth = useCallback(
    () => loadMonth(yearMonth),
    [loadMonth, yearMonth]
  );

  // 入力は layout の全画面モーダルで開く。記録を足す・直すとこの画面の月データが
  // 古くなるので、保存後に取り直す。
  const openNote = (editing?: NoteRecordDefault) =>
    noteModal.open({
      editing,
      initialDate: selectedDate,
      onSaved: reloadMonth
    });

  const moveMonth = (delta: number) => {
    const nextYearMonth = shiftMonth(yearMonth, delta);
    // 見出しとグリッドの枠を先に送る。データはこの後で追いつく。
    setYearMonth(nextYearMonth);
    // 月を変えたら選択日もその月の 1 日へ送る（前月の日を選んだままにしない）。
    setSelectedDate(`${nextYearMonth}-01`);
    loadMonth(nextYearMonth);
  };

  const cells = useMemo(() => buildMonthGrid(yearMonth), [yearMonth]);

  const daySums = useMemo(
    () =>
      isStale
        ? new Map<string, DaySum>()
        : new Map(month.days.map((day) => [day.dateStr, day])),
    [isStale, month.days]
  );

  // 予定とリマインダーを同じ形に寄せてから段を割り当てる。
  const lanes = useMemo(() => {
    if (isStale) {
      return assignEventLanes([], MAX_LANES);
    }
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
  }, [isStale, month.plans, month.reminders]);

  const [year, monthPart] = yearMonth.split('-');

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
            {/* monthSum は「支出=正」向きなので符号を反転して出す。色は符号によらず本文色。
                その月の値が届くまでは出さない（前月の金額が新しい見出しに残るのを防ぐ）。 */}
            <span className='font-semibold text-[15px]'>
              {isStale
                ? null
                : formatSignedPrice(
                    Math.abs(month.monthSum),
                    month.monthSum > 0
                  )}
            </span>
          </span>
          <div className='ml-auto flex gap-1.5'>
            <MonthNavButton direction='prev' onClick={() => moveMonth(-1)} />
            <MonthNavButton direction='next' onClick={() => moveMonth(1)} />
          </div>
        </div>

        {/* 枠と日付は yearMonth だけで決まるので月送りの直後に正しくなる。
            収支と予定の帯は daySums / lanes が空になるぶんだけ欠け、届いた時点で埋まる。
            日付まで薄くなるのは避けたいので opacity は掛けず、更新中は aria-busy で示す。 */}
        <div aria-busy={isPending}>
          <MonthGrid
            cells={cells}
            daySums={daySums}
            lanes={lanes}
            onSelect={setSelectedDate}
            selectedDate={selectedDate}
          />
        </div>

        <div className='grid grid-cols-2 gap-2.5'>
          <button
            className='flex h-11 items-center justify-center gap-1.5 rounded-xl bg-primary font-semibold text-[15px] text-primary-foreground'
            onClick={() => openNote()}
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
          isLoading={isStale}
          onEditPlan={(plan) => setPlanSheet({ kind: 'edit', plan })}
          onEditRecord={(record) => openNote(record)}
          plans={isStale ? [] : selectDayPlans(month.plans, selectedDate)}
          reminders={
            isStale ? [] : selectDayReminders(month.reminders, selectedDate)
          }
        />

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

// 取得中も押せるままにする。月送りは連打してその場で数か月進めたい操作で、
// 1 往復ごとに待たせると体験が悪い。後から届いた古い月の応答は loadMonth が捨てる。
function MonthNavButton({
  direction,
  onClick
}: {
  direction: 'prev' | 'next';
  onClick: () => void;
}) {
  return (
    <button
      aria-label={direction === 'prev' ? '前の月' : '次の月'}
      className='flex size-9 items-center justify-center rounded-full bg-card text-foreground'
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
