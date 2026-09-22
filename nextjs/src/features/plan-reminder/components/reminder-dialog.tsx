'use client';

import { getFormProps, useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod/v4';
import { useState } from 'react';
import { ColorPicker } from '@/components/form/color-picker';
import { FormField } from '@/components/form/form-field';
import { useCloseOnSuccess } from '@/components/form/use-close-on-success';
import { useFormAction } from '@/components/form/use-form-action';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { ColorClassification } from '@/features/master';
import { L } from '@/lib/shared/labels';
import { insertReminderAction } from '../actions';
import { dayOptionsForMonth, daysInMonthFixed } from '../domain/month-days';
import { planReminderLabels } from '../labels';
import {
  BaseType,
  ConditionType,
  ReminderType,
  reminderInsertSchema
} from '../schemas';

// 定期的な予定（reminder + condition）の作成ダイアログ（Nuxt PlanReminderDialog.vue 移植）。
// reminder_type（残す/残さない）・condition_type（〜ヶ月後/月日）で必須項目が分岐する。
// 分岐する数値はローカル state で持ち、hidden input として送出して Conform に渡す。
// 現行は「追加/削除」のみで編集はないため upsert ではなく insert。

const { reminder: R, entity } = planReminderLabels;

// 〜ヶ月後の選択肢（1〜12）。月日指定の「月」も同じ 1〜12。
const MONTH_VALUES = Array.from({ length: 12 }, (_, i) => i + 1);

type ReminderDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  colors: ColorClassification[];
  isPair: boolean;
};

export function ReminderDialog({
  open,
  onOpenChange,
  colors,
  isPair
}: ReminderDialogProps) {
  const [result, action] = useFormAction(insertReminderAction);
  const [form, fields] = useForm({
    lastResult: result?.submission,
    onValidate: ({ formData }) =>
      parseWithZod(formData, { schema: reminderInsertSchema })
  });
  useCloseOnSuccess(result, onOpenChange);

  // 分岐する条件はローカル state で持ち hidden input に載せる。
  const [reminderType, setReminderType] = useState<number>(ReminderType.stock);
  const [conditionType, setConditionType] = useState<number>(
    ConditionType.month
  );
  const [baseType, setBaseType] = useState<number>(BaseType.now);
  const [month, setMonth] = useState<number>(1);
  const [monthPart, setMonthPart] = useState<number>(1);
  const [dayPart, setDayPart] = useState<number>(1);

  // 月日 'MM-DD'（monthDay 指定時のみ送る）。
  const monthDay = `${String(monthPart).padStart(2, '0')}-${String(dayPart).padStart(2, '0')}`;
  const isMonth = conditionType === ConditionType.month;

  // 「日」候補は選択中の月に連動させ、存在しない月日（4/31・2/30 等）を選べなくする（旧 DaysByMonth 相当）。
  const dayOptions = dayOptionsForMonth(monthPart);

  // 月を切り替えたとき、現在の日がその月末を超えていたら末日へ丸める（例: 1/31 → 2 月選択で 2/28）。
  const changeMonthPart = (nextMonth: number) => {
    setMonthPart(nextMonth);
    const lastDay = daysInMonthFixed(nextMonth);
    if (dayPart > lastDay) {
      setDayPart(lastDay);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{planReminderLabels.heading.reminder}</DialogTitle>
        </DialogHeader>
        <form
          {...getFormProps(form)}
          action={action}
          className='flex flex-col gap-4'
        >
          <input type='hidden' name='isPair' value={String(isPair)} readOnly />
          <input
            type='hidden'
            name='reminderType'
            value={reminderType}
            readOnly
          />
          <input
            type='hidden'
            name='conditionType'
            value={conditionType}
            readOnly
          />
          {isMonth ? (
            <>
              <input type='hidden' name='month' value={month} readOnly />
              <input type='hidden' name='baseType' value={baseType} readOnly />
            </>
          ) : (
            <input type='hidden' name='monthDay' value={monthDay} readOnly />
          )}

          <FormField label={entity.reminderName} field={fields.name} />

          <ColorPicker
            name='colorId'
            label={L.button.color}
            colors={colors}
            errors={fields.colorId.errors}
            errorId={fields.colorId.errorId}
          />

          <div className='flex flex-col gap-2'>
            <Label htmlFor={fields.memo.id}>{entity.memo}</Label>
            <Input id={fields.memo.id} name={fields.memo.name} type='text' />
          </div>

          <FormField label={entity.date} field={fields.date} type='date' />

          <div className='flex flex-col gap-2'>
            <Label>{R.checkKeep}</Label>
            <RadioGroup
              value={String(reminderType)}
              onValueChange={(v) => setReminderType(Number(v))}
              className='flex gap-4'
            >
              <RadioOption value={String(ReminderType.stock)} label={R.keep} />
              <RadioOption
                value={String(ReminderType.flow)}
                label={R.notKeep}
              />
            </RadioGroup>
          </div>

          <div className='flex flex-col gap-2'>
            <Label>{R.nextPlan}</Label>
            <RadioGroup
              value={String(conditionType)}
              onValueChange={(v) => setConditionType(Number(v))}
              className='flex gap-4'
            >
              <RadioOption
                value={String(ConditionType.month)}
                label={R.afterMonths}
              />
              <RadioOption
                value={String(ConditionType.monthDay)}
                label={R.monthDay}
              />
            </RadioGroup>
          </div>

          {isMonth ? (
            <div className='flex flex-col gap-2'>
              <RadioGroup
                value={String(baseType)}
                onValueChange={(v) => setBaseType(Number(v))}
                className='flex flex-col gap-1'
              >
                <RadioOption value={String(BaseType.now)} label={R.baseNow} />
                <RadioOption value={String(BaseType.date)} label={R.baseDate} />
              </RadioGroup>
              <div className='flex items-center gap-2'>
                {R.from}
                <NativeSelect
                  value={month}
                  onChange={setMonth}
                  options={MONTH_VALUES}
                  label={R.months}
                />
                {R.months}
              </div>
            </div>
          ) : (
            <div className='flex items-center gap-2'>
              <NativeSelect
                value={monthPart}
                onChange={changeMonthPart}
                options={MONTH_VALUES}
                label={R.month}
              />
              {R.month}
              <NativeSelect
                value={dayPart}
                onChange={setDayPart}
                options={dayOptions}
                label={R.day}
              />
              {R.day}
            </div>
          )}
          {fields.month.errors ? (
            <p className='text-sm text-red-600' role='alert'>
              {fields.month.errors.join(' / ')}
            </p>
          ) : null}
          {fields.monthDay.errors ? (
            <p className='text-sm text-red-600' role='alert'>
              {fields.monthDay.errors.join(' / ')}
            </p>
          ) : null}

          <DialogFooter>
            <Button type='submit'>{L.button.save}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ラジオ 1 択（RadioGroupItem に id を振り Label で関連付ける。a11y 対応）。
function RadioOption({ value, label }: { value: string; label: string }) {
  const id = `radio-${value}-${label}`;
  return (
    <div className='flex items-center gap-1'>
      <RadioGroupItem id={id} value={value} />
      <Label htmlFor={id} className='font-normal'>
        {label}
      </Label>
    </div>
  );
}

// 数値セレクト（base-ui Select は FormData 連携が煩雑なため、条件分岐値は
// ローカル state + hidden input に載せる方針。ここは表示用の素の select）。
type NativeSelectProps = {
  value: number;
  onChange: (value: number) => void;
  options: number[];
  label: string;
};

function NativeSelect({ value, onChange, options, label }: NativeSelectProps) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className='h-8 rounded-lg border border-input bg-transparent px-2 text-sm'
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}
