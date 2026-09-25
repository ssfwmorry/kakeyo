'use client';

import { useEffect, useId, useState, useTransition } from 'react';
import type { DateRange } from 'react-day-picker';
import { useFormAction } from '@/components/form/use-form-action';
import { useFormToast } from '@/components/form/use-form-toast';
import { colorVar } from '@/features/master';
import { planReminderLabels } from '@/features/plan-reminder/labels';
import type { PlanItem, PlanTypeCard } from '@/features/plan-reminder/types';
import { addDaysJst, listDatesJst } from '@/lib/shared/domain/date';
import { formatLocalDate, parseLocalDate } from '@/lib/shared/domain/localDate';
import type { FormActionResult } from '@/lib/shared/types/formResult';
import { SheetHeader, SheetTrashButton } from '@/v2/components/sheet-header';
import {
  BottomSheet,
  BottomSheetContent
} from '@/v2/components/ui/bottom-sheet';
import { ConfirmAlert } from '@/v2/components/ui/confirm-alert';
import { InlineCalendar } from '@/v2/components/ui/inline-calendar';
import { SheetSubmitButton } from '@/v2/components/ui/sheet-submit-button';
import { Switch } from '@/v2/components/ui/switch';
import { formatSlashDateWeekJa, quoted } from '@/v2/lib/format';
import { useSubmissionErrorToast } from '@/v2/lib/submission-error';
import { deletePlanAction, savePlanAction } from '../actions';

// 予定の追加・編集シート（原典 PlanAdd / PlanEdit）。旧 /plan 画面を
// カレンダーの上に出るシートに置き換える。
//
// 上から「×｜予定を追加（共有）｜ゴミ箱」、予定名、日付（単日／期間）と期間スイッチ、
// カテゴリのチップ、メモ。下端に張り付く保存ボタン。削除はヘッダー右のゴミ箱から
// 中央の確認を経て行う。
//
// 日付は行のボタンを押すとすぐ下に暦が開く（README D8）。シートの上にさらにシートを重ねない。
// 保存しても遷移せず、閉じた側（カレンダー）が月を取り直す。
//
// 入力欄の下にエラーを出す場所は無い。主ボタンの活性はクライアント状態で決め、
// サーバの検証に落ちたときだけトーストで理由を出す。

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
  useSubmissionErrorToast(result);
  useEffect(() => {
    if (result?.toast?.type === 'success') {
      onSaved();
      onOpenChange(false);
    }
  }, [result, onSaved, onOpenChange]);

  const initial = toInitialValues(plan, initialDate);
  const [name, setName] = useState(initial.name);
  const [memo, setMemo] = useState(initial.memo);
  const [isPeriod, setIsPeriod] = useState(initial.isPeriod);
  const [startDate, setStartDate] = useState(initial.startDate);
  const [endDate, setEndDate] = useState(initial.endDate);
  const [planTypeId, setPlanTypeId] = useState(initial.planTypeId);

  // 単日（期間 OFF）のとき終了日は開始日に揃えて送る。
  const submittedEndDate = isPeriod ? endDate : startDate;
  const canSave = name.trim() !== '';
  const isEdit = plan !== undefined;
  const verb = isEdit ? '保存' : '追加';
  const title = isEdit ? '予定を編集' : '予定を追加';
  const close = () => onOpenChange(false);

  const remove = useDeleteFlow(plan?.id, () => {
    onSaved();
    close();
  });
  const formId = useId();

  return (
    <BottomSheet onOpenChange={onOpenChange} open>
      <BottomSheetContent
        aria-label={title}
        // 保存はスクロール領域の外の帯に置く。中身が長くてもボタンは見えたまま。
        footer={
          <SheetSubmitButton
            disabled={!canSave || isPending}
            disabledLabel={`予定名を入れると${verb}できます`}
            form={formId}
            label={`${verb}する`}
          />
        }
      >
        <SheetHeader
          left='close'
          onLeft={close}
          right={
            isEdit ? (
              <SheetTrashButton
                disabled={remove.isPending}
                label='この予定を削除'
                onClick={remove.ask}
              />
            ) : undefined
          }
          tag={isPair ? '共有' : undefined}
          title={title}
        />

        <form action={action} className='flex flex-col gap-3.5' id={formId}>
          <HiddenFields
            endDate={submittedEndDate}
            isPair={isPair}
            planId={plan?.id}
            planTypeId={planTypeId}
            startDate={startDate}
          />

          <label className='flex h-13 shrink-0 items-center rounded-xl bg-card px-3.5'>
            <input
              aria-label={planReminderLabels.entity.planName}
              className='min-w-0 flex-grow bg-transparent font-semibold text-foreground text-lg outline-none'
              maxLength={30}
              name='name'
              onChange={(event) => setName(event.target.value)}
              placeholder='予定名（30文字まで）'
              type='text'
              value={name}
            />
          </label>

          <DateSection
            endDate={submittedEndDate}
            isPeriod={isPeriod}
            onChange={(next) => {
              setStartDate(next.startDate);
              setEndDate(next.endDate);
            }}
            onPeriodChange={(next) => {
              setIsPeriod(next);
              // ON にした瞬間に最低 2 日間にする。OFF は単日に戻す。
              setEndDate(
                next ? maxDate(endDate, addDaysJst(startDate, 1)) : startDate
              );
            }}
            startDate={startDate}
          />

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
              name='memo'
              onChange={(event) => setMemo(event.target.value)}
              placeholder='任意。URL を貼るとリンクになります'
              value={memo}
            />
          </div>
        </form>

        {plan === undefined ? null : (
          <ConfirmAlert
            description={`${quoted(plan.name)}を削除します。削除すると元に戻せません。`}
            onCancel={remove.cancel}
            onConfirm={remove.run}
            open={remove.isConfirming}
            pending={remove.isPending}
            title='この予定を削除しますか？'
          />
        )}
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
  memo: string;
  isPeriod: boolean;
  startDate: string;
  endDate: string;
  planTypeId: number | null;
} {
  if (plan === undefined) {
    return {
      name: '',
      memo: '',
      isPeriod: false,
      startDate: initialDate,
      endDate: initialDate,
      planTypeId: null
    };
  }
  return {
    name: plan.name,
    memo: plan.memo ?? '',
    isPeriod: plan.startDate !== plan.endDate,
    startDate: plan.startDate,
    endDate: plan.endDate,
    planTypeId: plan.planTypeId
  };
}

// 'YYYY-MM-DD' は辞書順が日付順。
function maxDate(a: string, b: string): string {
  return a > b ? a : b;
}

// Server Action へ送る hidden 群。スキーマの名前に合わせる。
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
        <div className='flex h-[50px] items-center gap-2 px-3.5'>
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
            aria-label={isPeriod ? '期間を選ぶ' : undefined}
            className='h-8.5 whitespace-nowrap rounded-lg bg-fill-soft px-3 font-semibold text-[15px] text-foreground'
            onClick={() => setIsPicking((prev) => !prev)}
            type='button'
          >
            {isPeriod
              ? `${formatSlashDateWeekJa(startDate)} 〜 ${formatSlashDateWeekJa(endDate)}`
              : formatSlashDateWeekJa(startDate)}
          </button>
        </div>
        <div className='ml-3.5 border-t' />
        <div className='flex h-[50px] items-center px-3.5'>
          <span className='flex-grow text-base'>期間を指定</span>
          <Switch
            aria-label='期間を指定'
            checked={isPeriod}
            offClass='bg-disabled'
            onCheckedChange={onPeriodChange}
          />
        </div>
      </div>

      {isPicking ? (
        <div className='flex justify-center rounded-[14px] bg-card py-2'>
          {isPeriod ? (
            <InlineCalendar
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
            <InlineCalendar
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
          color='var(--dash)'
          isSelected={value === null}
          label='なし'
          onSelect={() => onChange(null)}
          // 「なし」は色を持たないので、選択中も文字は本文色のまま。
          selectedTextColor='var(--foreground)'
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
  onSelect,
  selectedTextColor = color
}: {
  label: string;
  color: string;
  isSelected: boolean;
  onSelect: () => void;
  selectedTextColor?: string;
}) {
  return (
    <button
      aria-pressed={isSelected}
      className='flex h-9 items-center gap-1.5 rounded-full border-[1.5px] px-3 font-semibold text-sm'
      onClick={onSelect}
      style={
        isSelected
          ? {
              backgroundColor: `color-mix(in srgb, ${color} 15%, var(--card))`,
              borderColor: color,
              color: selectedTextColor
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

// 削除の一連の状態。ゴミ箱 → 中央の確認 → 実行 → 成功なら閉じる。
function useDeleteFlow(id: number | undefined, onDeleted: () => void) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<FormActionResult | null>(null);
  useFormToast(result);

  const run = () => {
    if (id === undefined) {
      return;
    }
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

  return {
    isConfirming,
    isPending,
    ask: () => setIsConfirming(true),
    cancel: () => setIsConfirming(false),
    run
  };
}
