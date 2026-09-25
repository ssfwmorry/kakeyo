'use client';

import { getFormProps, useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod/v4';
import { cn } from 'cn';
import { useState } from 'react';
import { useFormAction } from '@/components/form/use-form-action';
import { IconCalendar, IconChevronLeft, IconMemo } from '@/components/icons';
import { colorVar } from '@/features/master';
import { recordLabels } from '@/features/record/labels';
import { recordUpsertSchema } from '@/features/record/schemas/record-schema';
import type { MethodCard, TypeCard } from '@/features/type-method';
import { createRecordAction } from '../actions';
import { buildDateChips, withSelectedChip } from '../domain/date-chips';
import { Chip } from './chip';
import { DateSheet } from './date-sheet';
import { Keypad } from './keypad';
import type { NoteState } from './note-state';

// 入力フロー 2 枚目: 金額と詳細（デザイン Note / NoteIncome / NotePair）。
//
// 上から「戻る｜選んだカテゴリ」「日付」「（共有なら）だれのお金で払った？」「方法」「メモ」、
// 下に金額とテンキー、登録ボタン。金額を一番下に置くのは、テンキーの真上に見えるようにするため。
//
// 共有モードはメモ必須（ペアに見える内容なので何の記録か分かるようにする）。
// 満たさないうちは登録ボタンの文言で理由を伝える。

export function AmountStep({
  state,
  isPair,
  selectedType,
  methods,
  methodId,
  today,
  onBack,
  patch
}: {
  state: NoteState;
  isPair: boolean;
  selectedType: TypeCard;
  methods: MethodCard[];
  // 候補に対して正規化済みの方法 id（state のそれではなくこちらを送る）。
  methodId: number | null;
  today: string;
  onBack: () => void;
  patch: (next: Partial<NoteState>) => void;
}) {
  const [result, action, isPending] = useFormAction(createRecordAction);
  const [form] = useForm({
    lastResult: result?.submission,
    onValidate: ({ formData }) =>
      parseWithZod(formData, { schema: recordUpsertSchema })
  });
  // 検証エラーの多くは hidden に付くので、フォーム全体のエラーとしてまとめて出す。
  const errorMessages = [...new Set(Object.values(form.allErrors).flat())];

  const showInstead = isPair && state.isPay;
  const needsMemo = isPair && state.memo.trim() === '';
  const canSubmit = methodId !== null && state.price > 0 && !needsMemo;

  return (
    <form
      {...getFormProps(form)}
      action={action}
      className='flex min-h-full flex-col gap-3.5 px-4'
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 34px)' }}
    >
      <HiddenFields isPair={isPair} methodId={methodId} state={state} />

      <StepHeader
        isPair={isPair}
        isPay={state.isPay}
        onBack={onBack}
        selectedType={selectedType}
        subTypeId={state.subTypeId}
      />

      <DateField
        onChange={(date) => patch({ date })}
        today={today}
        value={state.date}
      />

      {showInstead ? (
        <InsteadField
          isInstead={state.isInstead}
          onChange={(isInstead) => patch({ isInstead, methodId: null })}
        />
      ) : null}

      <Field label={`${state.isPay ? '支払' : '受取'}方法`}>
        {methods.length === 0 ? (
          <p className='px-1 text-muted-foreground text-sm'>
            {recordLabels.empty.noMethod}
          </p>
        ) : (
          <div className='-mx-4 flex gap-2 overflow-x-auto px-4'>
            {methods.map((method) => (
              <Chip
                isSelected={method.id === methodId}
                key={method.id}
                onClick={() => patch({ methodId: method.id })}
              >
                {method.name}
              </Chip>
            ))}
          </div>
        )}
      </Field>

      <MemoField
        isPair={isPair}
        isRequired={needsMemo}
        onChange={(memo) => patch({ memo })}
        value={state.memo}
      />

      <AmountDisplay isPay={state.isPay} price={state.price} />
      <Keypad onChange={(price) => patch({ price })} value={state.price} />

      {errorMessages.length > 0 ? (
        <p className='text-destructive text-sm' role='alert'>
          {errorMessages.join(' / ')}
        </p>
      ) : null}

      <button
        className={cn(
          'h-13 rounded-xl font-bold text-[17px]',
          canSubmit
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted font-semibold text-[15px] text-muted-foreground'
        )}
        disabled={!canSubmit || isPending}
        type='submit'
      >
        {needsMemo ? 'メモを入れると登録できます' : '登録する'}
      </button>
    </form>
  );
}

// Server Action へ送る hidden 群。record_type と所有者の導出は Server に委ねる。
function HiddenFields({
  state,
  isPair,
  methodId
}: {
  state: NoteState;
  isPair: boolean;
  methodId: number | null;
}) {
  // 立替は共有 & 支出のときだけ意味を持つ。それ以外は false で送る。
  const isInstead = isPair && state.isPay ? state.isInstead : false;
  return (
    <>
      <input name='date' readOnly type='hidden' value={state.date} />
      <input name='isPay' readOnly type='hidden' value={String(state.isPay)} />
      <input name='isPair' readOnly type='hidden' value={String(isPair)} />
      <input
        name='isInstead'
        readOnly
        type='hidden'
        value={String(isInstead)}
      />
      <input
        name='typeId'
        readOnly
        type='hidden'
        value={String(state.typeId ?? '')}
      />
      {state.subTypeId === null ? null : (
        <input
          name='subTypeId'
          readOnly
          type='hidden'
          value={String(state.subTypeId)}
        />
      )}
      {methodId === null ? null : (
        <input
          name='methodId'
          readOnly
          type='hidden'
          value={String(methodId)}
        />
      )}
      <input name='memo' readOnly type='hidden' value={state.memo} />
      <input name='price' readOnly type='hidden' value={String(state.price)} />
    </>
  );
}

// 「＜」と、選んだカテゴリの丸いピル。ピルを押しても 1 枚目に戻る（選び直しの導線）。
function StepHeader({
  isPay,
  isPair,
  selectedType,
  subTypeId,
  onBack
}: {
  isPay: boolean;
  isPair: boolean;
  selectedType: TypeCard;
  subTypeId: number | null;
  onBack: () => void;
}) {
  const subName = selectedType.subTypes.find((sub) => sub.id === subTypeId);
  return (
    <div className='grid h-12 grid-cols-[44px_1fr_44px] items-center'>
      <button
        aria-label='カテゴリに戻る'
        className='flex size-9 items-center justify-center rounded-full bg-muted text-foreground'
        onClick={onBack}
        type='button'
      >
        <IconChevronLeft
          aria-hidden='true'
          className='size-4.5'
          strokeWidth={2.4}
        />
      </button>
      <button
        className='flex h-9 max-w-full items-center gap-2 justify-self-center rounded-full bg-card px-3.5 text-foreground'
        onClick={onBack}
        type='button'
      >
        <span
          aria-hidden='true'
          className='size-2.5 shrink-0 rounded-full'
          style={{ backgroundColor: colorVar(selectedType.colorName) }}
        />
        <span className='truncate font-semibold text-[15px]'>
          {selectedType.name}
          {subName === undefined ? '' : ` › ${subName.name}`}
        </span>
        <Badge isAccent={!isPay}>
          {isPay ? recordLabels.payToggle.pay : recordLabels.payToggle.income}
        </Badge>
        {isPair ? <Badge isAccent>共有</Badge> : null}
      </button>
    </div>
  );
}

function Badge({
  isAccent,
  children
}: {
  isAccent: boolean;
  children: string;
}) {
  return (
    <span
      className={cn(
        'flex h-5 shrink-0 items-center rounded-md px-1.5 font-bold text-[11px]',
        isAccent ? 'bg-secondary text-primary' : 'bg-muted text-foreground'
      )}
    >
      {children}
    </span>
  );
}

function Field({
  label,
  children
}: {
  label: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className='flex flex-col gap-1.5'>
      <span className='font-semibold text-[12px] text-muted-foreground'>
        {label}
      </span>
      {children}
    </div>
  );
}

// 今日・昨日・おとといのチップと、それ以外の日を選ぶカレンダーのボタン。
function DateField({
  value,
  today,
  onChange
}: {
  value: string;
  today: string;
  onChange: (date: string) => void;
}) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const chips = withSelectedChip(buildDateChips(today), value);
  return (
    <Field label={recordLabels.field.date}>
      <div className='-mx-4 flex gap-2 overflow-x-auto px-4'>
        {chips.map((chip) => (
          <Chip
            isSelected={chip.date === value}
            key={chip.date}
            onClick={() => onChange(chip.date)}
          >
            {chip.label}
          </Chip>
        ))}
        <button
          aria-label='他の日を選ぶ'
          className='flex size-9 shrink-0 items-center justify-center rounded-full bg-card text-foreground'
          onClick={() => setIsSheetOpen(true)}
          type='button'
        >
          <IconCalendar aria-hidden='true' className='size-4' />
        </button>
      </div>
      <DateSheet
        isOpen={isSheetOpen}
        onChange={onChange}
        onOpenChange={setIsSheetOpen}
        value={value}
      />
    </Field>
  );
}

// 共有モードの支出でだけ出る「だれのお金で払った？」。
// 立替（自分の方法で払って精算する）か共有のお金（ペアの方法・精算しない）か。
// 切り替えると方法の候補が入れ替わるので、呼び出し側で方法の選択を捨てる。
function InsteadField({
  isInstead,
  onChange
}: {
  isInstead: boolean;
  onChange: (isInstead: boolean) => void;
}) {
  return (
    <Field label='だれのお金で払った？'>
      <fieldset
        aria-label='だれのお金で払った？'
        className='flex rounded-[10px] bg-muted p-[3px]'
      >
        <InsteadOption
          isSelected={isInstead}
          note='あとで精算する'
          onSelect={() => onChange(true)}
          title='自分が立替'
        />
        <InsteadOption
          isSelected={!isInstead}
          note='精算しない'
          onSelect={() => onChange(false)}
          title='共有のお金'
        />
      </fieldset>
    </Field>
  );
}

function InsteadOption({
  title,
  note,
  isSelected,
  onSelect
}: {
  title: string;
  note: string;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      aria-pressed={isSelected}
      className={cn(
        'flex h-10 flex-grow basis-0 flex-col items-center justify-center rounded-lg',
        isSelected ? 'bg-card shadow-sm' : 'bg-transparent'
      )}
      onClick={onSelect}
      type='button'
    >
      <span
        className={cn(
          'font-bold text-sm',
          isSelected ? 'text-foreground' : 'text-muted-foreground'
        )}
      >
        {title}
      </span>
      <span className='text-[11px] text-muted-foreground'>{note}</span>
    </button>
  );
}

function MemoField({
  value,
  isPair,
  isRequired,
  onChange
}: {
  value: string;
  isPair: boolean;
  // 共有モードでまだ空のとき。入力欄を赤い輪郭にして促す。
  isRequired: boolean;
  onChange: (memo: string) => void;
}) {
  return (
    <Field
      label={
        isPair ? (
          <>
            {recordLabels.field.memo}{' '}
            <span className='text-destructive'>必須</span>
            （ペアに見える内容）
          </>
        ) : (
          recordLabels.field.memo
        )
      }
    >
      <label
        className={cn(
          'flex h-11 items-center gap-2 rounded-xl bg-card px-3',
          isRequired && 'ring-[1.5px] ring-destructive/50'
        )}
      >
        <IconMemo
          aria-hidden='true'
          className='size-4 shrink-0 text-muted-foreground'
        />
        <input
          aria-label={recordLabels.field.memo}
          className='min-w-0 flex-grow bg-transparent text-[15px] text-foreground outline-none'
          onChange={(event) => onChange(event.target.value)}
          placeholder={isPair ? '例：週末の買い出し' : '任意'}
          type='text'
          value={value}
        />
      </label>
    </Field>
  );
}

// 金額。支出は「−」で文字色、収入は「+」でアクセント（デザイン Note / NoteIncome）。
function AmountDisplay({ isPay, price }: { isPay: boolean; price: number }) {
  return (
    <output
      aria-label={`${isPay ? recordLabels.payToggle.pay : recordLabels.payToggle.income}の金額`}
      className={cn(
        'mt-auto flex h-14 items-baseline justify-end gap-1.5 px-1 tabular-nums',
        isPay ? 'text-foreground' : 'text-primary'
      )}
    >
      <span className='font-bold text-[44px] tracking-tight'>
        {isPay ? '−' : '+'}
        {price.toLocaleString('ja-JP')}
      </span>
      <span className='font-semibold text-lg'>円</span>
    </output>
  );
}
