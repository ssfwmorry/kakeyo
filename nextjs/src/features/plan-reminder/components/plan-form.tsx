'use client';

import { getFormProps, useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod/v4';
import { useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { calendarJaProps } from '@/components/form/date-picker';
import { useFormAction } from '@/components/form/use-form-action';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { colorHex } from '@/features/master';
import { formatLocalDate, parseLocalDate } from '@/lib/shared/domain/localDate';
import { L } from '@/lib/shared/labels';
import { deletePlanAction, upsertPlanAction } from '../actions';
import { planReminderLabels } from '../labels';
import { planUpsertSchema } from '../schemas';
import type { GroupedPlanTypeList, PlanItem, PlanTypeCard } from '../types';

// 予定入力画面（/plan）のフォーム。単日/期間を「期間指定」チェックで切替え、
// 期間 OFF なら endDate=startDate を送る。
// 保存/削除は redirect（/calendar）を挟むため flash トースト。ここでは submission だけ
// 購読する（成功トーストは遷移先の FlashToast が発火）。

const { entity, plan: P } = planReminderLabels;

type PlanFormProps = {
  planTypeList: GroupedPlanTypeList;
  isPair: boolean;
  // 編集対象（calendar からの遷移で渡す想定）。未指定なら新規作成。
  editing?: PlanItem;
  // 新規作成時の初期日付（calendar の focus 日）。未指定なら空。
  initialDate?: string;
};

export function PlanForm({
  planTypeList,
  isPair,
  editing,
  initialDate
}: PlanFormProps) {
  const [result, action] = useFormAction(upsertPlanAction);
  const [deleteResult, deleteAction] = useFormAction(deletePlanAction);
  const [form, fields] = useForm({
    lastResult: result?.submission ?? deleteResult?.submission,
    onValidate: ({ formData }) =>
      parseWithZod(formData, { schema: planUpsertSchema })
  });

  const cards = isPair ? planTypeList.pair : planTypeList.self;
  const initial = initialFormState(editing, initialDate, cards);
  const [isPeriod, setIsPeriod] = useState(initial.isPeriod);
  const [startDate, setStartDate] = useState(initial.startDate);
  const [endDate, setEndDate] = useState(initial.endDate);
  const [planTypeId, setPlanTypeId] = useState<string>(initial.planTypeId);

  // 単日（期間 OFF）のとき endDate は startDate に一致させて送る。
  const submittedEndDate = isPeriod ? endDate : startDate;

  return (
    <form
      {...getFormProps(form)}
      action={action}
      className='flex flex-col gap-4'
    >
      {editing ? (
        <input type='hidden' name='id' value={editing.id} readOnly />
      ) : null}
      <input type='hidden' name='isPair' value={String(isPair)} readOnly />
      <input type='hidden' name='planTypeId' value={planTypeId} readOnly />
      <input
        type='hidden'
        name={fields.endDate.name}
        value={submittedEndDate}
        readOnly
      />

      <div className='flex flex-col gap-2'>
        <Label htmlFor={fields.name.id}>{entity.planName}</Label>
        <Input
          id={fields.name.id}
          name={fields.name.name}
          type='text'
          defaultValue={editing?.name ?? ''}
          placeholder='例：18:30 飲み会'
        />
        <FieldError errors={fields.name.errors} />
      </div>

      <PlanDateSection
        startId={fields.startDate.id}
        startName={fields.startDate.name}
        isPeriod={isPeriod}
        onPeriodChange={setIsPeriod}
        startDate={startDate}
        onStartChange={setStartDate}
        endDate={endDate}
        onEndChange={setEndDate}
        startErrors={fields.startDate.errors}
        endErrors={fields.endDate.errors}
      />

      <PlanTypeSelect
        cards={cards}
        value={planTypeId}
        onChange={setPlanTypeId}
      />

      <div className='flex flex-col gap-2'>
        <Label htmlFor={fields.memo.id}>{entity.memo}</Label>
        <Textarea
          id={fields.memo.id}
          name={fields.memo.name}
          defaultValue={editing?.memo ?? ''}
          placeholder='例：いつものお店にて'
        />
      </div>

      <PlanFormFooter editing={editing} deleteAction={deleteAction} />
    </form>
  );
}

// 新規/編集での初期フォーム状態を導出する純粋ヘルパ。
function initialFormState(
  editing: PlanItem | undefined,
  initialDate: string | undefined,
  cards: PlanTypeCard[]
): {
  isPeriod: boolean;
  startDate: string;
  endDate: string;
  planTypeId: string;
} {
  if (editing) {
    return {
      isPeriod: editing.startDate !== editing.endDate,
      startDate: editing.startDate,
      endDate: editing.endDate,
      planTypeId: editing.planTypeId != null ? String(editing.planTypeId) : ''
    };
  }
  const fallbackDate = initialDate ?? '';
  return {
    isPeriod: false,
    startDate: fallbackDate,
    endDate: fallbackDate,
    planTypeId: cards[0] ? String(cards[0].id) : ''
  };
}

// 削除（編集時のみ）+ 保存ボタンのフッタ。
function PlanFormFooter({
  editing,
  deleteAction
}: {
  editing: PlanItem | undefined;
  deleteAction: (payload: FormData) => void;
}) {
  return (
    <div className='flex items-center justify-between gap-2'>
      {editing ? (
        <Button
          type='submit'
          variant='destructive'
          formAction={deleteAction}
          name='id'
          value={editing.id}
        >
          {L.button.delete}
        </Button>
      ) : (
        <span />
      )}
      {/* 主ボタンは新規=登録 / 編集=変更で出し分ける（常に「保存」だと今どちらを
          しているかが読めない）。 */}
      <Button type='submit'>
        {editing ? L.button.update : L.button.create}
      </Button>
    </div>
  );
}

// field エラー表示（同一の三項演算を各所で繰り返さないための小部品）。
function FieldError({ errors }: { errors?: string[] }) {
  if (!errors) {
    return null;
  }
  return (
    <p className='text-sm text-red-600' role='alert'>
      {errors.join(' / ')}
    </p>
  );
}

// 開始日 + 期間チェック + 終了日（期間 ON のみ）をまとめた日付セクション。
type PlanDateSectionProps = {
  startId: string;
  startName: string;
  isPeriod: boolean;
  onPeriodChange: (value: boolean) => void;
  startDate: string;
  onStartChange: (value: string) => void;
  endDate: string;
  onEndChange: (value: string) => void;
  startErrors?: string[];
  endErrors?: string[];
};

// 選択済み日付の表示ラベル（'2026年9月22日'）。未選択は空文字。
function dateLabel(value: string): string {
  const d = parseLocalDate(value);
  if (!d) {
    return '';
  }
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

function PlanDateSection({
  startId,
  startName,
  isPeriod,
  onPeriodChange,
  startDate,
  onStartChange,
  endDate,
  onEndChange,
  startErrors,
  endErrors
}: PlanDateSectionProps) {
  const periodId = `${startId}-period`;

  // hidden の startDate（Conform 連携）は常に維持し、UI はカレンダー選択で更新する。
  // トリガーの表示ラベル: 期間 ON は「開始 〜 終了」、単日は選択日（未選択はプレースホルダ）。
  const triggerLabel = isPeriod
    ? startDate && endDate
      ? `${dateLabel(startDate)} 〜 ${dateLabel(endDate)}`
      : dateLabel(startDate) || entity.startDate
    : dateLabel(startDate) || entity.date;

  // 期間 ON の range 選択ハンドラ（from=開始 / to=終了。to 未定なら開始と同値）。
  const handleRangeSelect = (range: DateRange | undefined) => {
    if (range?.from) {
      onStartChange(formatLocalDate(range.from));
      onEndChange(formatLocalDate(range.to ?? range.from));
    }
  };

  return (
    <>
      <input
        id={startId}
        type='hidden'
        name={startName}
        value={startDate}
        readOnly
      />

      <div className='flex items-center gap-2'>
        <Checkbox
          id={periodId}
          checked={isPeriod}
          onCheckedChange={(checked) => onPeriodChange(checked === true)}
        />
        <Label htmlFor={periodId} className='font-normal'>
          {P.period}
        </Label>
      </div>

      <div className='flex flex-col gap-2'>
        <Label>{isPeriod ? P.period : entity.date}</Label>
        <Popover>
          <PopoverTrigger
            render={
              <Button
                type='button'
                variant='outline'
                className='justify-start'
              />
            }
          >
            {triggerLabel}
          </PopoverTrigger>
          <PopoverContent className='w-auto p-0'>
            {isPeriod ? (
              <Calendar
                mode='range'
                {...calendarJaProps}
                selected={{
                  from: parseLocalDate(startDate),
                  to: parseLocalDate(endDate)
                }}
                onSelect={handleRangeSelect}
                autoFocus
              />
            ) : (
              <Calendar
                mode='single'
                {...calendarJaProps}
                selected={parseLocalDate(startDate)}
                onSelect={(date) => {
                  if (date) {
                    onStartChange(formatLocalDate(date));
                  }
                }}
                autoFocus
              />
            )}
          </PopoverContent>
        </Popover>
        <FieldError errors={startErrors} />
        <FieldError errors={endErrors} />
      </div>
    </>
  );
}

// 予定カテゴリのセレクト（base-ui Select は FormData 連携が煩雑なため
// 色チップ付きの素の select + hidden で表現）。
function PlanTypeSelect({
  cards,
  value,
  onChange
}: {
  cards: PlanTypeCard[];
  value: string;
  onChange: (value: string) => void;
}) {
  if (cards.length === 0) {
    return <p className='text-sm text-muted-foreground'>{P.noPlanType}</p>;
  }
  const selected = cards.find((card) => String(card.id) === value);
  return (
    <div className='flex flex-col gap-2'>
      <Label>{planReminderLabels.heading.planType}</Label>
      <div className='flex items-center gap-2'>
        {selected ? (
          <span
            className='inline-block size-5 rounded-full'
            style={{ backgroundColor: colorHex(selected.colorName) }}
          />
        ) : null}
        <select
          aria-label={P.planTypeSelect}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className='h-8 flex-1 rounded-lg border border-input bg-transparent px-2 text-sm'
        >
          {cards.map((card) => (
            <option key={card.id} value={card.id}>
              {card.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
