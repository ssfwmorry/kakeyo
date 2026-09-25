'use client';

import { getFormProps, useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod/v4';
import { cn } from 'cn';
import { useEffect, useState, useTransition } from 'react';
import type { DateRange } from 'react-day-picker';
import { calendarJaProps } from '@/components/form/date-picker';
import { useFormAction } from '@/components/form/use-form-action';
import { useFormToast } from '@/components/form/use-form-toast';
import { IconTrash } from '@/components/icons';
import { Calendar } from '@/components/ui/calendar';
import { colorVar } from '@/features/master';
import { planReminderLabels } from '@/features/plan-reminder/labels';
import { planUpsertSchema } from '@/features/plan-reminder/schemas';
import type { PlanItem, PlanTypeCard } from '@/features/plan-reminder/types';
import {
  formatDateWithWeekdayJst,
  listDatesJst
} from '@/lib/shared/domain/date';
import { formatLocalDate, parseLocalDate } from '@/lib/shared/domain/localDate';
import type { FormActionResult } from '@/lib/shared/types/formResult';
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetTitle
} from '@/v2/components/ui/bottom-sheet';
import { ConfirmAlert } from '@/v2/components/ui/confirm-alert';
import { deletePlanAction, savePlanAction } from '../actions';

// 予定の追加・編集シート（デザイン PlanAdd / PlanEdit）。旧 /plan 画面を
// カレンダーの上に出るシートに置き換える。
//
// 上から「キャンセル｜予定を追加｜（共有）」、予定名、日付（単日／期間）と期間スイッチ、
// カテゴリのチップ、メモ。下端に削除（編集のみ）と保存。
// 日付は行のボタンを押すとすぐ下に暦が開く。シートの上にさらにシートを重ねない。
//
// 保存しても遷移せず、閉じた側（カレンダー）が月を取り直す。

export function PlanSheet({
  plan,
  planTypes,
  isPair,
  initialDate,
  onOpenChange,
  onSaved
}: {
  // 編集対象。追加のときは undefined。
  plan?: PlanItem;
  // 今のモードで選べる予定カテゴリ。
  planTypes: PlanTypeCard[];
  isPair: boolean;
  // 追加時の初期日付（カレンダーの選択日）。
  initialDate: string;
  onOpenChange: (isOpen: boolean) => void;
  // 保存・削除が成功したとき。呼び出し側で月を取り直す。
  onSaved: () => void;
}) {
  const [result, action, isPending] = useFormAction(savePlanAction);
  const [form, fields] = useForm({
    lastResult: result?.submission,
    onValidate: ({ formData }) =>
      parseWithZod(formData, { schema: planUpsertSchema })
  });
  useEffect(() => {
    if (result?.toast?.type === 'success') {
      onSaved();
      onOpenChange(false);
    }
  }, [result, onSaved, onOpenChange]);

  const initial = toInitialValues(plan, initialDate);
  const [name, setName] = useState(initial.name);
  const [isPeriod, setIsPeriod] = useState(initial.isPeriod);
  const [startDate, setStartDate] = useState(initial.startDate);
  const [endDate, setEndDate] = useState(initial.endDate);
  const [planTypeId, setPlanTypeId] = useState(initial.planTypeId);

  // 単日（期間 OFF）のとき終了日は開始日に揃えて送る。
  const submittedEndDate = isPeriod ? endDate : startDate;
  const canSave = name.trim() !== '';
  const isEdit = plan !== undefined;
  const saveVerb = isEdit ? '保存' : '追加';

  return (
    <BottomSheet onOpenChange={onOpenChange} open>
      <BottomSheetContent>
        <form
          {...getFormProps(form)}
          action={action}
          className='flex flex-col gap-3.5'
        >
          <HiddenFields
            endDate={submittedEndDate}
            isPair={isPair}
            planId={plan?.id}
            planTypeId={planTypeId}
            startDate={startDate}
          />

          <SheetHeader
            isPair={isPair}
            onCancel={() => onOpenChange(false)}
            title={isEdit ? '予定を編集' : '予定を追加'}
          />

          <label className='flex h-13 items-center rounded-xl bg-card px-3.5'>
            <input
              aria-label={planReminderLabels.entity.planName}
              className='min-w-0 flex-grow bg-transparent font-semibold text-foreground text-lg outline-none'
              maxLength={30}
              name={fields.name.name}
              onChange={(event) => setName(event.target.value)}
              placeholder='予定名（30文字まで）'
              type='text'
              value={name}
            />
          </label>
          <FieldError errors={fields.name.errors} />

          <DateSection
            endDate={submittedEndDate}
            isPeriod={isPeriod}
            onChange={(next) => {
              setStartDate(next.startDate);
              setEndDate(next.endDate);
            }}
            onPeriodChange={setIsPeriod}
            startDate={startDate}
          />
          <FieldError errors={fields.endDate.errors} />

          <TypeChips
            onChange={setPlanTypeId}
            planTypes={planTypes}
            value={planTypeId}
          />

          <div className='flex flex-col gap-2'>
            <span className='pl-1 text-[13px] text-muted-foreground'>
              {planReminderLabels.entity.memo}
            </span>
            <textarea
              aria-label={planReminderLabels.entity.memo}
              className='h-21 resize-none rounded-xl bg-card px-3.5 py-3 text-[15px] text-foreground leading-relaxed outline-none'
              defaultValue={plan?.memo ?? ''}
              name={fields.memo.name}
              placeholder='任意。URL を貼るとリンクになります'
            />
          </div>

          <SheetFooter
            canSave={canSave}
            isPending={isPending}
            onDeleted={() => {
              onSaved();
              onOpenChange(false);
            }}
            planId={plan?.id}
            saveVerb={saveVerb}
          />
        </form>
      </BottomSheetContent>
    </BottomSheet>
  );
}

// 新規／編集の初期値。編集は対象の値、新規はカレンダーの選択日を単日で。
function toInitialValues(
  plan: PlanItem | undefined,
  initialDate: string
): {
  name: string;
  isPeriod: boolean;
  startDate: string;
  endDate: string;
  planTypeId: number | null;
} {
  if (plan === undefined) {
    return {
      name: '',
      isPeriod: false,
      startDate: initialDate,
      endDate: initialDate,
      planTypeId: null
    };
  }
  return {
    name: plan.name,
    isPeriod: plan.startDate !== plan.endDate,
    startDate: plan.startDate,
    endDate: plan.endDate,
    planTypeId: plan.planTypeId
  };
}

// Server Action へ送る hidden 群。スキーマの名前に合わせる（Conform の fields を通さず
// 素の name で送るのは、値が全て state 由来で Conform の管理下にないため）。
function HiddenFields({
  planId,
  isPair,
  planTypeId,
  startDate,
  endDate
}: {
  planId?: number;
  isPair: boolean;
  planTypeId: number | null;
  startDate: string;
  endDate: string;
}) {
  return (
    <>
      {planId === undefined ? null : (
        <input name='id' readOnly type='hidden' value={planId} />
      )}
      <input name='isPair' readOnly type='hidden' value={String(isPair)} />
      <input
        name='planTypeId'
        readOnly
        type='hidden'
        value={planTypeId ?? ''}
      />
      <input name='startDate' readOnly type='hidden' value={startDate} />
      <input name='endDate' readOnly type='hidden' value={endDate} />
    </>
  );
}

// 「キャンセル｜見出し｜（共有）」。保存はフッタにあるので右は空ける。
function SheetHeader({
  title,
  isPair,
  onCancel
}: {
  title: string;
  isPair: boolean;
  onCancel: () => void;
}) {
  return (
    <div className='grid h-10 grid-cols-[1fr_auto_1fr] items-center'>
      <button
        className='justify-self-start text-base text-primary'
        onClick={onCancel}
        type='button'
      >
        キャンセル
      </button>
      <span className='flex items-center gap-1.5'>
        <BottomSheetTitle className='text-[17px]'>{title}</BottomSheetTitle>
        {isPair ? (
          <span className='flex h-5 items-center rounded-md bg-secondary px-1.5 font-bold text-[11px] text-primary'>
            共有
          </span>
        ) : null}
      </span>
    </div>
  );
}

// 下端に固定した削除（編集のみ）と保存。シートの中身が長くてもボタンは見えたまま。
function SheetFooter({
  planId,
  canSave,
  isPending,
  saveVerb,
  onDeleted
}: {
  planId?: number;
  canSave: boolean;
  isPending: boolean;
  // 「追加」「保存」。ボタンとその理由の文言に使う。
  saveVerb: string;
  onDeleted: () => void;
}) {
  return (
    <div
      className='-mx-4 sticky bottom-0 mt-1 flex gap-2.5 border-t bg-popover px-4 pt-3'
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 20px)' }}
    >
      {planId === undefined ? null : (
        <PlanDeleteButton id={planId} onDeleted={onDeleted} />
      )}
      <button
        className={cn(
          'h-13 flex-grow rounded-xl font-bold text-[17px]',
          canSave
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted font-semibold text-base text-muted-foreground'
        )}
        disabled={!canSave || isPending}
        type='submit'
      >
        {canSave ? `${saveVerb}する` : `予定名を入れると${saveVerb}できます`}
      </button>
    </div>
  );
}

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors) {
    return null;
  }
  return (
    <p className='px-1 text-destructive text-sm' role='alert'>
      {errors.join(' / ')}
    </p>
  );
}

// 日付（単日）／期間の行と、期間スイッチ。行のボタンを押すと下に暦が開く。
function DateSection({
  isPeriod,
  startDate,
  endDate,
  onChange,
  onPeriodChange
}: {
  isPeriod: boolean;
  startDate: string;
  endDate: string;
  onChange: (next: { startDate: string; endDate: string }) => void;
  onPeriodChange: (isPeriod: boolean) => void;
}) {
  const [isPicking, setIsPicking] = useState(false);
  const dayCount = listDatesJst(startDate, endDate).length;

  return (
    <div className='flex flex-col gap-2'>
      <div className='overflow-hidden rounded-[14px] bg-card'>
        <div className='flex h-12.5 items-center gap-2 px-3.5'>
          <span className='flex-grow text-base'>
            {isPeriod ? '期間' : '日付'}
          </span>
          {isPeriod ? (
            <span className='text-[13px] text-muted-foreground'>
              {dayCount}日間
            </span>
          ) : null}
          <button
            aria-expanded={isPicking}
            className='h-8.5 whitespace-nowrap rounded-lg bg-muted px-3 font-semibold text-[15px] text-foreground'
            onClick={() => setIsPicking((prev) => !prev)}
            type='button'
          >
            {isPeriod
              ? `${formatDateWithWeekdayJst(startDate)} 〜 ${formatDateWithWeekdayJst(endDate)}`
              : formatDateWithWeekdayJst(startDate)}
          </button>
        </div>
        <div className='ml-3.5 border-t' />
        <div className='flex h-12.5 items-center px-3.5'>
          <span className='flex-grow text-base'>期間を指定</span>
          <PeriodSwitch
            isOn={isPeriod}
            onChange={(next) => {
              onPeriodChange(next);
              // 期間 OFF に戻したら終了日も開始日に揃える。
              if (!next) {
                onChange({ startDate, endDate: startDate });
              }
            }}
          />
        </div>
      </div>

      {isPicking ? (
        <div className='flex justify-center rounded-[14px] bg-card py-2'>
          {isPeriod ? (
            <Calendar
              {...calendarJaProps}
              autoFocus
              className='bg-transparent'
              defaultMonth={parseLocalDate(startDate)}
              mode='range'
              onSelect={(range: DateRange | undefined) => {
                if (range?.from === undefined) {
                  return;
                }
                // 期間は選び直しが多いので自動では閉じない。行のボタンでたたむ。
                onChange({
                  startDate: formatLocalDate(range.from),
                  endDate: formatLocalDate(range.to ?? range.from)
                });
              }}
              selected={{
                from: parseLocalDate(startDate),
                to: parseLocalDate(endDate)
              }}
            />
          ) : (
            <Calendar
              {...calendarJaProps}
              autoFocus
              className='bg-transparent'
              defaultMonth={parseLocalDate(startDate)}
              mode='single'
              onSelect={(next) => {
                if (next === undefined) {
                  return;
                }
                const date = formatLocalDate(next);
                onChange({ startDate: date, endDate: date });
                setIsPicking(false);
              }}
              selected={parseLocalDate(startDate)}
            />
          )}
        </div>
      ) : null}
    </div>
  );
}

// iOS 風のスイッチ（56×32）。shadcn の Switch は形が違うので v2 では自前で持つ。
function PeriodSwitch({
  isOn,
  onChange
}: {
  isOn: boolean;
  onChange: (isOn: boolean) => void;
}) {
  return (
    <button
      aria-checked={isOn}
      aria-label='期間を指定'
      className={cn(
        'relative h-8 w-14 shrink-0 rounded-full transition-colors',
        isOn ? 'bg-primary' : 'bg-muted'
      )}
      onClick={() => onChange(!isOn)}
      role='switch'
      type='button'
    >
      <span
        className={cn(
          'absolute top-0.5 left-0.5 size-7 rounded-full bg-card shadow-sm transition-transform',
          isOn && 'translate-x-6'
        )}
      />
    </button>
  );
}

// カテゴリのチップ。「なし」+ 今のモードのカテゴリ。選択中は色の淡い地に色の枠。
function TypeChips({
  planTypes,
  value,
  onChange
}: {
  planTypes: PlanTypeCard[];
  value: number | null;
  onChange: (planTypeId: number | null) => void;
}) {
  return (
    <div className='flex flex-col gap-2'>
      <span className='pl-1 text-[13px] text-muted-foreground'>
        {planReminderLabels.heading.planType}
      </span>
      <div className='flex flex-wrap gap-2'>
        <TypeChip
          color='var(--muted-foreground)'
          isSelected={value === null}
          label='なし'
          onSelect={() => onChange(null)}
        />
        {planTypes.map((type) => (
          <TypeChip
            color={colorVar(type.colorName)}
            isSelected={value === type.id}
            key={type.id}
            label={type.name}
            onSelect={() => onChange(type.id)}
          />
        ))}
      </div>
    </div>
  );
}

function TypeChip({
  label,
  color,
  isSelected,
  onSelect
}: {
  label: string;
  color: string;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      aria-pressed={isSelected}
      className='flex h-9 items-center gap-1.5 rounded-full border-[1.5px] px-3 font-semibold text-sm'
      onClick={onSelect}
      style={
        isSelected
          ? {
              backgroundColor: `color-mix(in oklch, ${color} 15%, var(--card))`,
              borderColor: color,
              color
            }
          : {
              backgroundColor: 'var(--card)',
              borderColor: 'transparent',
              color: 'var(--foreground)'
            }
      }
      type='button'
    >
      <span
        aria-hidden='true'
        className='size-2.5 rounded-full'
        style={{ backgroundColor: color }}
      />
      {label}
    </button>
  );
}

// 削除。確認は v2 の ConfirmAlert。ヘッダー右への移動は T04。
function PlanDeleteButton({
  id,
  onDeleted
}: {
  id: number;
  onDeleted: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [isConfirming, setIsConfirming] = useState(false);
  const [result, setResult] = useState<FormActionResult | null>(null);
  useFormToast(result);

  const remove = () => {
    setIsConfirming(false);
    startTransition(async () => {
      const formData = new FormData();
      formData.set('id', String(id));
      const next = await deletePlanAction(null, formData);
      setResult(next);
      if (next.toast?.type === 'success') {
        onDeleted();
      }
    });
  };

  return (
    <>
      <button
        aria-label='この予定を削除'
        className='flex size-13 shrink-0 items-center justify-center rounded-xl bg-destructive-soft text-destructive disabled:opacity-50'
        disabled={isPending}
        onClick={() => setIsConfirming(true)}
        type='button'
      >
        <IconTrash aria-hidden='true' className='size-5' />
      </button>
      <ConfirmAlert
        onCancel={() => setIsConfirming(false)}
        onConfirm={remove}
        open={isConfirming}
        pending={isPending}
        title='この予定を削除しますか？'
      />
    </>
  );
}
