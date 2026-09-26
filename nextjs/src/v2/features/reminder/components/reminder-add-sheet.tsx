'use client';

import { getFormProps, useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod/v4';
import { cn } from 'cn';
import { useEffect, useState } from 'react';
import { useFormAction } from '@/components/form/use-form-action';
import {
  IconCalendar,
  IconChevronLeft,
  IconChevronRight,
  IconUpdate
} from '@/components/icons';
import type { ColorClassification } from '@/features/master';
import { insertReminderAction } from '@/features/plan-reminder/actions';
import { daysInMonthFixed } from '@/features/plan-reminder/domain/month-days';
import {
  BaseType,
  ConditionType,
  ReminderType
} from '@/features/plan-reminder/domain/reminder-condition';
import { reminderInsertSchema } from '@/features/plan-reminder/schemas';
import { addDaysJst } from '@/lib/shared/domain/date';
import { formatLocalDate, parseLocalDate } from '@/lib/shared/domain/localDate';
import { SheetHeader } from '@/v2/components/sheet-header';
import {
  BottomSheet,
  BottomSheetContent
} from '@/v2/components/ui/bottom-sheet';
import { ColorGrid } from '@/v2/components/ui/color-grid';
import { InlineCalendar } from '@/v2/components/ui/inline-calendar';
import { RoundIconButton } from '@/v2/components/ui/round-icon-button';
import { Segment } from '@/v2/components/ui/segment';
import { SheetSubmitButton } from '@/v2/components/ui/sheet-submit-button';
import { formatMonthDayWeekJa } from '@/v2/lib/format';
import { useSubmissionErrorToast } from '@/v2/lib/submission-error';
import { type ReminderRule, summaryText } from '../domain/describe';

// リマインダーの追加シート（原典 SetReminderAdd / SetReminderAddYearly）。
//
// 上から「名前・メモ」「色」「いつ（最初の日・次の日の決め方）」「チェックしたあと」、
// 要約、下端に張り付く「追加する」。編集は無く、内容を変えるときは削除して追加し直す。
//
// 「次の日」は 2 種: 〜か月後（チェックした日か、お知らせの日から数える）と 毎年（月日）。
// 毎年に切り替えた瞬間に、最初の日の月日を初期値にする。

const MIN_MONTHS = 1;
const MAX_MONTHS = 36;
const DEFAULT_OFFSET_DAYS = 7;

const CONDITION_OPTIONS = [
  { value: 'month', label: '〜か月後' },
  { value: 'year', label: '毎年' }
] as const;

const TYPE_OPTIONS = [
  { value: 'stock', label: '予定に残す', sub: 'カレンダーに記録が残る' },
  { value: 'flow', label: '残さない', sub: '次の日付に進むだけ' }
] as const;

type Draft = {
  name: string;
  memo: string;
  date: string;
  isYearly: boolean;
  isFromDate: boolean;
  months: number;
  yearMonth: number;
  yearDay: number;
  isStock: boolean;
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
      isYearly: false,
      isFromDate: false,
      months: 1,
      yearMonth: (first?.getMonth() ?? 0) + 1,
      yearDay: first?.getDate() ?? 1,
      isStock: true
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
            disabled={!canSave || isPending}
            disabledLabel='名前を入れると追加できます'
            form={form.id}
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

          <div className='flex flex-col gap-1.5'>
            <SectionLabel>チェックしたあと</SectionLabel>
            <Segment
              label='チェックしたあと'
              onChange={(value) => patch({ isStock: value === 'stock' })}
              options={TYPE_OPTIONS}
              size='xl'
              value={draft.isStock ? 'stock' : 'flow'}
            />
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

// 入力中の値を DB の condition と同じ形にする（要約と hidden の両方がこれを使う）。
function toRule(draft: Draft): ReminderRule {
  if (draft.isYearly) {
    return {
      conditionType: ConditionType.monthDay,
      month: null,
      monthDay: `${String(draft.yearMonth).padStart(2, '0')}-${String(draft.yearDay).padStart(2, '0')}`,
      baseType: null
    };
  }
  return {
    conditionType: ConditionType.month,
    month: draft.months,
    monthDay: null,
    baseType: draft.isFromDate ? BaseType.date : BaseType.now
  };
}

function HiddenFields({ draft, rule }: { draft: Draft; rule: ReminderRule }) {
  return (
    <>
      <input name='name' readOnly type='hidden' value={draft.name} />
      <input name='memo' readOnly type='hidden' value={draft.memo} />
      <input name='date' readOnly type='hidden' value={draft.date} />
      <input
        name='reminderType'
        readOnly
        type='hidden'
        value={draft.isStock ? ReminderType.stock : ReminderType.flow}
      />
      <input
        name='conditionType'
        readOnly
        type='hidden'
        value={rule.conditionType}
      />
      {rule.month === null ? null : (
        <input name='month' readOnly type='hidden' value={rule.month} />
      )}
      {rule.baseType === null ? null : (
        <input name='baseType' readOnly type='hidden' value={rule.baseType} />
      )}
      {rule.monthDay === null ? null : (
        <input name='monthDay' readOnly type='hidden' value={rule.monthDay} />
      )}
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

// 「次の日」の決め方。〜か月後はどの日から数えるかと月数、毎年は月日。
function NextRuleBlock({
  draft,
  patch
}: {
  draft: Draft;
  patch: (next: Partial<Draft>) => void;
}) {
  const setYearly = () => {
    // 毎年に切り替えた瞬間は、最初の日の月日から始める。
    const first = parseLocalDate(draft.date);
    patch({
      isYearly: true,
      yearMonth: (first?.getMonth() ?? 0) + 1,
      yearDay: first?.getDate() ?? 1
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
          onChange={(value) =>
            value === 'year' ? setYearly() : patch({ isYearly: false })
          }
          options={CONDITION_OPTIONS}
          size='lg'
          tone='background'
          value={draft.isYearly ? 'year' : 'month'}
        />
      </div>
      {draft.isYearly ? (
        <YearlyPicker draft={draft} patch={patch} />
      ) : (
        <MonthlyPicker draft={draft} patch={patch} />
      )}
    </div>
  );
}

function MonthlyPicker({
  draft,
  patch
}: {
  draft: Draft;
  patch: (next: Partial<Draft>) => void;
}) {
  return (
    <div className='flex flex-col gap-2.5 pl-7'>
      <fieldset aria-label='どの日から数えるか' className='flex gap-2'>
        <BasePill
          isSelected={!draft.isFromDate}
          label='チェックした日から'
          onClick={() => patch({ isFromDate: false })}
        />
        <BasePill
          isSelected={draft.isFromDate}
          label='リマインド日から'
          onClick={() => patch({ isFromDate: true })}
        />
      </fieldset>
      <div className='flex items-center gap-2.5'>
        <StepButton
          label='1か月へらす'
          onClick={() =>
            patch({ months: Math.max(draft.months - 1, MIN_MONTHS) })
          }
          size={36}
        >
          −
        </StepButton>
        <span className='min-w-14 text-center font-bold text-[20px]'>
          {draft.months}
        </span>
        <StepButton
          label='1か月ふやす'
          onClick={() =>
            patch({ months: Math.min(draft.months + 1, MAX_MONTHS) })
          }
          size={36}
        >
          ＋
        </StepButton>
        <span className='text-[15px]'>か月後</span>
      </div>
    </div>
  );
}

// 月と日は循環し、日はその月の日数で丸める（2 月は 28 日固定）。
function YearlyPicker({
  draft,
  patch
}: {
  draft: Draft;
  patch: (next: Partial<Draft>) => void;
}) {
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

function BasePill({
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
        'h-9 flex-grow basis-0 whitespace-nowrap rounded-full px-2.5 font-semibold text-[13px]',
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
