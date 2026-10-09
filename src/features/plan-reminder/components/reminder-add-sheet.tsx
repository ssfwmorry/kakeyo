'use client';

import { getFormProps, useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod/v4';
import { cn } from 'cn';
import { type ReactElement, useEffect, useState } from 'react';
import { useFormAction } from '@/components/form/use-form-action';
import { useSubmissionErrorToast } from '@/components/form/use-submission-error-toast';
import {
  IconCalendar,
  IconChevronLeft,
  IconChevronRight,
  IconUpdate
} from '@/components/icons';
import { SheetHeader } from '@/components/sheet-header';
import { BottomSheet, BottomSheetContent } from '@/components/ui/bottom-sheet';
import { ColorGrid } from '@/components/ui/color-grid';
import { InlineCalendar } from '@/components/ui/inline-calendar';
import { RoundIconButton } from '@/components/ui/round-icon-button';
import { Segment } from '@/components/ui/segment';
import { SheetSubmitButton } from '@/components/ui/sheet-submit-button';
import type { ColorClassification } from '@/features/master';
import { insertReminderAction } from '@/features/plan-reminder/actions';
import { daysInMonthFixed } from '@/features/plan-reminder/domain/month-days';
import type {
  Nth,
  ReminderRule,
  Weekday
} from '@/features/plan-reminder/domain/reminder-condition';
import { reminderInsertSchema } from '@/features/plan-reminder/schemas';
import {
  addDaysJst,
  nthOfMonthJst,
  weekdayJst
} from '@/lib/shared/domain/date';
import {
  formatMonthDayWeekJa,
  weekdayLabelJa
} from '@/lib/shared/domain/format';
import { formatLocalDate, parseLocalDate } from '@/lib/shared/domain/localDate';
import { summaryText } from '../domain/describe';

// リマインダーの追加シート（原典 SetReminderAdd / SetReminderAddYearly）。
//
// 上から「名前・メモ」「色」「いつ（最初の日・次の日の決め方）」、要約、
// 下端に張り付く「追加する」。編集は無く、内容を変えるときは削除して追加し直す。
//
// 「次の日」は 6 kind あるが、フラットな 6 択は横幅に収まらないので、nthWeek を
// 「週ごと」配下、monthEnd を「月ごと」配下のトグルに畳んでトップレベルを 4 択にする。

// month kind は特定の月に紐付かない（31 日を保持したまま短い月で押し込む）ので、
// 日の上限は月に依らず 31 で固定する。
const MAX_DAY_OF_MONTH = 31;

// 上限は reminderRuleSchema の interval / months と揃える。
const MIN_INTERVAL = 1;
const MAX_WEEK_INTERVAL = 52;
const MAX_MONTH_INTERVAL = 36;
const DEFAULT_OFFSET_DAYS = 7;

type RuleTab = 'week' | 'month' | 'year' | 'afterCheck';

const CONDITION_OPTIONS = [
  { value: 'week', label: '週ごと' },
  { value: 'month', label: '月ごと' },
  { value: 'year', label: '毎年' },
  { value: 'afterCheck', label: '先送り' }
] as const satisfies readonly { value: RuleTab; label: string }[];

const WEEKDAYS = [0, 1, 2, 3, 4, 5, 6] as const satisfies readonly Weekday[];

const NTH_OPTIONS = [
  { value: 1, label: '第1' },
  { value: 2, label: '第2' },
  { value: 3, label: '第3' },
  { value: 4, label: '第4' },
  { value: 5, label: '第5' },
  { value: 'last', label: '最終' }
] as const satisfies readonly { value: Nth; label: string }[];

// kind ごとの値を平坦に持ち、toRule で判別共用体に畳む。
type Draft = {
  name: string;
  memo: string;
  date: string;
  tab: RuleTab;
  weekInterval: number;
  weekday: Weekday;
  isNthWeek: boolean;
  nths: Nth[];
  monthInterval: number;
  monthDay: number;
  isMonthEnd: boolean;
  yearMonth: number;
  yearDay: number;
  afterMonths: number;
};

export function ReminderAddSheet({
  colors,
  today,
  onOpenChange
}: {
  colors: ColorClassification[];
  today: string;
  onOpenChange: (isOpen: boolean) => void;
}) {
  const [result, action, isPending] = useFormAction(insertReminderAction);
  const [form] = useForm({
    lastResult: result?.submission,
    onValidate: ({ formData }) =>
      parseWithZod(formData, { schema: reminderInsertSchema })
  });
  useSubmissionErrorToast(result);
  useEffect(() => {
    if (result?.toast?.type === 'success') {
      onOpenChange(false);
    }
  }, [result, onOpenChange]);

  const [draft, setDraft] = useState<Draft>(() => {
    const date = addDaysJst(today, DEFAULT_OFFSET_DAYS);
    const first = parseLocalDate(date);
    return {
      name: '',
      memo: '',
      date,
      tab: 'month',
      weekInterval: 1,
      weekday: weekdayJst(date),
      isNthWeek: false,
      nths: [nthOfMonthJst(date)],
      monthInterval: 1,
      monthDay: first?.getDate() ?? 1,
      isMonthEnd: false,
      yearMonth: (first?.getMonth() ?? 0) + 1,
      yearDay: first?.getDate() ?? 1,
      afterMonths: 1
    };
  });
  const patch = (next: Partial<Draft>) =>
    setDraft((prev) => ({ ...prev, ...next }));

  const rule = toRule(draft);
  const first = parseLocalDate(draft.date);
  const canSave = draft.name.trim() !== '';

  return (
    <BottomSheet onOpenChange={onOpenChange} open>
      <BottomSheetContent
        aria-label='リマインダーを追加'
        footer={
          <SheetSubmitButton
            disabled={!canSave}
            disabledLabel='名前を入れると追加できます'
            form={form.id}
            isPending={isPending}
            label='追加する'
          />
        }
      >
        <SheetHeader
          left='close'
          onLeft={() => onOpenChange(false)}
          title='リマインダーを追加'
        />

        <form
          {...getFormProps(form)}
          action={action}
          className='flex flex-col gap-3.5'
        >
          <HiddenFields draft={draft} rule={rule} />

          <div className='overflow-hidden rounded-[14px] bg-card'>
            <label className='flex h-13 items-center gap-2.5 px-3.5'>
              <RowLabel>名前</RowLabel>
              <input
                aria-label='リマインダーの名前'
                className='min-w-0 flex-grow bg-transparent font-semibold text-[17px] text-foreground outline-none'
                maxLength={10}
                onChange={(event) => patch({ name: event.target.value })}
                placeholder='例：歯医者'
                type='text'
                value={draft.name}
              />
              <span className='shrink-0 text-muted-foreground text-xs'>
                {draft.name.length}/10
              </span>
            </label>
            <label className='flex h-13 items-center gap-2.5 border-line-soft border-t px-3.5'>
              <RowLabel>メモ</RowLabel>
              <input
                aria-label='メモ'
                className='min-w-0 flex-grow bg-transparent text-[16px] text-foreground outline-none'
                onChange={(event) => patch({ memo: event.target.value })}
                placeholder='任意。URL を貼るとリンクになります'
                type='text'
                value={draft.memo}
              />
            </label>
          </div>

          <ColorGrid colors={colors} label='色' name='colorId' size={36} />

          <div className='flex flex-col gap-1.5'>
            <SectionLabel>いつ</SectionLabel>
            <div className='overflow-hidden rounded-[14px] bg-card'>
              <FirstDateRow
                onChange={(date) => patch({ date })}
                today={today}
                value={draft.date}
              />
              <NextRuleBlock draft={draft} patch={patch} />
            </div>
          </div>

          {first === undefined ? null : (
            <p className='rounded-xl bg-secondary px-3.5 py-3 text-[13px] text-foreground leading-relaxed'>
              {summaryText({
                name: draft.name,
                firstDate: {
                  month: first.getMonth() + 1,
                  day: first.getDate()
                },
                rule
              })}
            </p>
          )}
        </form>
      </BottomSheetContent>
    </BottomSheet>
  );
}

// 平坦な Draft を判別共用体に畳む（要約と hidden の両方がこれを使う）。
function toRule(draft: Draft): ReminderRule {
  switch (draft.tab) {
    case 'week':
      return draft.isNthWeek
        ? { kind: 'nthWeek', nths: draft.nths, weekday: draft.weekday }
        : {
            kind: 'week',
            interval: draft.weekInterval,
            weekday: draft.weekday
          };
    case 'month':
      return draft.isMonthEnd
        ? { kind: 'monthEnd', interval: draft.monthInterval }
        : {
            kind: 'month',
            interval: draft.monthInterval,
            day: draft.monthDay
          };
    case 'year':
      return { kind: 'year', month: draft.yearMonth, day: draft.yearDay };
    case 'afterCheck':
      return { kind: 'afterCheck', months: draft.afterMonths };
  }
}

// rule は JSON 1 本で送る（kind ごとに hidden を出し分けない）。
function HiddenFields({ draft, rule }: { draft: Draft; rule: ReminderRule }) {
  return (
    <>
      <input name='name' readOnly type='hidden' value={draft.name} />
      <input name='memo' readOnly type='hidden' value={draft.memo} />
      <input name='date' readOnly type='hidden' value={draft.date} />
      <input name='rule' readOnly type='hidden' value={JSON.stringify(rule)} />
    </>
  );
}

function RowLabel({ children }: { children: string }) {
  return (
    <span className='w-[34px] shrink-0 text-[14px] text-muted-foreground'>
      {children}
    </span>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <span className='pl-1 text-[13px] text-muted-foreground'>{children}</span>
  );
}

// 「最初の日」。前後 1 日は丸ボタン、離れた日は暦を行の下に展開して選ぶ。今日より前には戻れない。
function FirstDateRow({
  value,
  today,
  onChange
}: {
  value: string;
  today: string;
  onChange: (date: string) => void;
}) {
  const [isPicking, setIsPicking] = useState(false);
  const canGoPrev = value > today;
  const minDate = parseLocalDate(today);

  return (
    <>
      <div className='flex h-13 items-center gap-2.5 py-0 pr-2 pl-3.5'>
        <IconCalendar
          aria-hidden='true'
          className='size-4.5 shrink-0 text-muted-foreground'
        />
        <span className='shrink-0 text-[14px] text-muted-foreground'>
          最初の日
        </span>
        <button
          aria-expanded={isPicking}
          aria-label='日付を選ぶ'
          className='flex h-11 min-w-0 flex-grow items-center whitespace-nowrap font-semibold text-[16px] text-foreground'
          onClick={() => setIsPicking((prev) => !prev)}
          type='button'
        >
          {formatMonthDayWeekJa(value, { today })}
        </button>
        <RoundIconButton
          aria-label='前の日'
          disabled={!canGoPrev}
          onClick={() => onChange(addDaysJst(value, -1))}
          tone='soft'
        >
          <IconChevronLeft
            aria-hidden='true'
            className={cn('size-4', !canGoPrev && 'text-icon-muted')}
            strokeWidth={2.4}
          />
        </RoundIconButton>
        <RoundIconButton
          aria-label='次の日'
          onClick={() => onChange(addDaysJst(value, 1))}
          tone='soft'
        >
          <IconChevronRight
            aria-hidden='true'
            className='size-4'
            strokeWidth={2.4}
          />
        </RoundIconButton>
      </div>
      {isPicking ? (
        <div className='flex justify-center border-line-soft border-t pb-1'>
          <InlineCalendar
            defaultMonth={parseLocalDate(value)}
            disabled={minDate === undefined ? undefined : { before: minDate }}
            mode='single'
            onSelect={(next) => {
              if (next === undefined) {
                return;
              }
              onChange(formatLocalDate(next));
              setIsPicking(false);
            }}
            selected={parseLocalDate(value)}
            startMonth={minDate}
          />
        </div>
      ) : null}
    </>
  );
}

// 「次の日」の決め方。トップレベル 4 択 + kind ごとのピッカー。
function NextRuleBlock({
  draft,
  patch
}: {
  draft: Draft;
  patch: (next: Partial<Draft>) => void;
}) {
  // 切り替えた瞬間の初期値は「最初の日」から導く。
  const selectTab = (tab: RuleTab) => {
    const first = parseLocalDate(draft.date);
    const day = first?.getDate() ?? 1;
    patch({
      tab,
      ...(tab === 'week' && { weekday: weekdayJst(draft.date) }),
      ...(tab === 'month' && { monthDay: day }),
      ...(tab === 'year' && {
        yearMonth: (first?.getMonth() ?? 0) + 1,
        yearDay: day
      })
    });
  };

  return (
    <div className='flex flex-col gap-2.5 border-line-soft border-t px-3.5 pt-2.5 pb-3.5'>
      <div className='flex items-center gap-2.5'>
        <IconUpdate
          aria-hidden='true'
          className='size-4.5 shrink-0 text-muted-foreground'
        />
        <span className='shrink-0 text-[14px] text-muted-foreground'>
          次の日
        </span>
        <Segment
          className='flex-grow'
          label='次の日の決め方'
          onChange={selectTab}
          options={CONDITION_OPTIONS}
          size='lg'
          tone='background'
          value={draft.tab}
        />
      </div>
      <Picker draft={draft} patch={patch} />
    </div>
  );
}

type PickerProps = {
  draft: Draft;
  patch: (next: Partial<Draft>) => void;
};

// tab ごとのピッカー。Record が網羅を強制するので、tab を増やすと追従漏れが型で出る。
const PICKERS: Record<RuleTab, (props: PickerProps) => ReactElement> = {
  week: WeekPicker,
  month: MonthPicker,
  year: YearlyPicker,
  afterCheck: AfterCheckPicker
};

function Picker({ draft, patch }: PickerProps) {
  const Selected = PICKERS[draft.tab];
  return <Selected draft={draft} patch={patch} />;
}

// 週ごと。「第 N 曜日にする」を ON にすると nthWeek に変わる。
function WeekPicker({ draft, patch }: PickerProps) {
  // 最後の 1 つは外せない（空配列は不正なので解除を無視する）。
  const toggleNth = (nth: Nth) => {
    const has = draft.nths.includes(nth);
    if (has && draft.nths.length === 1) {
      return;
    }
    patch({
      nths: has ? draft.nths.filter((v) => v !== nth) : [...draft.nths, nth]
    });
  };

  return (
    <div className='flex flex-col gap-2.5 pl-7'>
      {draft.isNthWeek ? null : (
        <div className='flex items-center gap-2.5'>
          <Stepper
            decLabel='間隔をへらす'
            incLabel='間隔をふやす'
            onChange={(weekInterval) => patch({ weekInterval })}
            max={MAX_WEEK_INTERVAL}
            min={MIN_INTERVAL}
            value={draft.weekInterval}
          />
          <span className='text-[15px]'>週ごとの</span>
        </div>
      )}
      <WeekdayRow
        onChange={(weekday) => patch({ weekday })}
        value={draft.weekday}
      />
      <CheckRow
        isChecked={draft.isNthWeek}
        label='第 N 曜日にする'
        onChange={(isNthWeek) =>
          patch({
            isNthWeek,
            // ON にした瞬間は、最初の日が属する週番号 1 つだけを入れる。
            ...(isNthWeek ? { nths: [nthOfMonthJst(draft.date)] } : {})
          })
        }
      />
      {draft.isNthWeek ? (
        <fieldset aria-label='第何週か' className='flex flex-wrap gap-1.5'>
          {NTH_OPTIONS.map((option) => (
            <TogglePill
              isSelected={draft.nths.includes(option.value)}
              key={option.label}
              label={option.label}
              onClick={() => toggleNth(option.value)}
            />
          ))}
        </fieldset>
      ) : null}
    </div>
  );
}

// 月ごと。「月末にする」を ON にすると monthEnd に変わる。
function MonthPicker({ draft, patch }: PickerProps) {
  return (
    <div className='flex flex-col gap-2.5 pl-7'>
      <div className='flex items-center gap-2.5'>
        <Stepper
          decLabel='間隔をへらす'
          incLabel='間隔をふやす'
          onChange={(monthInterval) => patch({ monthInterval })}
          max={MAX_MONTH_INTERVAL}
          min={MIN_INTERVAL}
          value={draft.monthInterval}
        />
        <span className='text-[15px]'>か月ごとの</span>
        {draft.isMonthEnd ? (
          <span className='text-[15px]'>月末</span>
        ) : (
          <>
            <Stepper
              decLabel='前の日'
              incLabel='次の日'
              onChange={(monthDay) => patch({ monthDay })}
              max={MAX_DAY_OF_MONTH}
              min={1}
              size={32}
              value={draft.monthDay}
            />
            <span className='text-[15px]'>日</span>
          </>
        )}
      </div>
      <CheckRow
        isChecked={draft.isMonthEnd}
        label='月末にする'
        onChange={(isMonthEnd) => patch({ isMonthEnd })}
      />
    </div>
  );
}

function AfterCheckPicker({ draft, patch }: PickerProps) {
  return (
    <div className='flex items-center gap-2.5 pl-7'>
      <span className='text-[15px]'>チェックした日から</span>
      <Stepper
        decLabel='1か月へらす'
        incLabel='1か月ふやす'
        onChange={(afterMonths) => patch({ afterMonths })}
        max={MAX_MONTH_INTERVAL}
        min={MIN_INTERVAL}
        value={draft.afterMonths}
      />
      <span className='text-[15px]'>か月後</span>
    </div>
  );
}

function WeekdayRow({
  value,
  onChange
}: {
  value: Weekday;
  onChange: (weekday: Weekday) => void;
}) {
  return (
    <fieldset aria-label='曜日' className='flex gap-1.5'>
      {WEEKDAYS.map((weekday) => (
        <TogglePill
          isSelected={value === weekday}
          key={weekday}
          label={weekdayLabelJa(weekday)}
          onClick={() => onChange(weekday)}
        />
      ))}
    </fieldset>
  );
}

function CheckRow({
  label,
  isChecked,
  onChange
}: {
  label: string;
  isChecked: boolean;
  onChange: (isChecked: boolean) => void;
}) {
  return (
    <label className='flex items-center gap-2 text-[14px] text-foreground'>
      <input
        checked={isChecked}
        className='size-4 accent-primary'
        onChange={(event) => onChange(event.target.checked)}
        type='checkbox'
      />
      {label}
    </label>
  );
}

function TogglePill({
  label,
  isSelected,
  onClick
}: {
  label: string;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      aria-pressed={isSelected}
      className={cn(
        'h-8 min-w-9 shrink-0 rounded-full px-2 font-semibold text-[13px]',
        isSelected
          ? 'bg-primary text-primary-foreground'
          : 'bg-background text-foreground'
      )}
      onClick={onClick}
      type='button'
    >
      {label}
    </button>
  );
}

// −/+ で 1 ずつ動かす数値入力（min/max で丸める）。
function Stepper({
  value,
  min,
  max,
  size = 36,
  decLabel,
  incLabel,
  onChange
}: {
  value: number;
  min: number;
  max: number;
  size?: 32 | 36;
  decLabel: string;
  incLabel: string;
  onChange: (value: number) => void;
}) {
  return (
    <div className='flex items-center gap-1.5'>
      <StepButton
        label={decLabel}
        onClick={() => onChange(Math.max(value - 1, min))}
        size={size}
      >
        −
      </StepButton>
      <span
        className={cn(
          'text-center font-bold',
          size === 36 ? 'min-w-10 text-[20px]' : 'min-w-6 text-[18px]'
        )}
      >
        {value}
      </span>
      <StepButton
        label={incLabel}
        onClick={() => onChange(Math.min(value + 1, max))}
        size={size}
      >
        ＋
      </StepButton>
    </div>
  );
}

// 月と日は循環し、日はその月の日数で丸める（2 月は 28 日固定）。
function YearlyPicker({ draft, patch }: PickerProps) {
  const wrap = (value: number, min: number, max: number) =>
    value < min ? max : value > max ? min : value;
  const setMonth = (month: number) =>
    patch({
      yearMonth: month,
      yearDay: Math.min(draft.yearDay, daysInMonthFixed(month))
    });
  const lastDay = daysInMonthFixed(draft.yearMonth);
  return (
    <div className='flex items-center gap-1.5'>
      <span className='text-[15px]'>毎年</span>
      <StepButton
        label='前の月'
        onClick={() => setMonth(wrap(draft.yearMonth - 1, 1, 12))}
        size={32}
      >
        −
      </StepButton>
      <span className='min-w-6 text-center font-bold text-[18px]'>
        {draft.yearMonth}
      </span>
      <StepButton
        label='次の月'
        onClick={() => setMonth(wrap(draft.yearMonth + 1, 1, 12))}
        size={32}
      >
        ＋
      </StepButton>
      <span className='text-[15px]'>月</span>
      <StepButton
        label='前の日'
        onClick={() => patch({ yearDay: wrap(draft.yearDay - 1, 1, lastDay) })}
        size={32}
      >
        −
      </StepButton>
      <span className='min-w-6 text-center font-bold text-[18px]'>
        {draft.yearDay}
      </span>
      <StepButton
        label='次の日'
        onClick={() => patch({ yearDay: wrap(draft.yearDay + 1, 1, lastDay) })}
        size={32}
      >
        ＋
      </StepButton>
      <span className='text-[15px]'>日</span>
    </div>
  );
}

function StepButton({
  label,
  size,
  onClick,
  children
}: {
  label: string;
  size: 32 | 36;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      aria-label={label}
      className={cn(
        'shrink-0 rounded-full bg-background text-foreground',
        size === 36 ? 'size-9 text-[20px]' : 'size-8 text-[18px]'
      )}
      onClick={onClick}
      type='button'
    >
      {children}
    </button>
  );
}
