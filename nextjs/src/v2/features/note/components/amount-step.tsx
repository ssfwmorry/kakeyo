'use client';

import { getFormProps, useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod/v4';
import { cn } from 'cn';
import { useEffect, useState, useTransition } from 'react';
import { ConfirmDialog } from '@/components/form/confirm-dialog';
import { calendarJaProps } from '@/components/form/date-picker';
import { useFormAction } from '@/components/form/use-form-action';
import { useFormToast } from '@/components/form/use-form-toast';
import { IconCalendar, IconMemo, IconTrash } from '@/components/icons';
import { Calendar } from '@/components/ui/calendar';
import { colorVar } from '@/features/master';
import { recordLabels } from '@/features/record/labels';
import { recordUpsertSchema } from '@/features/record/schemas/record-schema';
import type { MethodCard, TypeCard } from '@/features/type-method';
import { formatLocalDate, parseLocalDate } from '@/lib/shared/domain/localDate';
import type { FormActionResult } from '@/lib/shared/types/formResult';
import { deleteRecordAction, upsertRecordAction } from '../actions';
import { buildDateChips, withSelectedChip } from '../domain/date-chips';
import { Chip } from './chip';
import { Keypad } from './keypad';
import type { NoteState } from './note-state';
import { SheetHeader } from './sheet-header';

// 記録シート 3 枚目: 金額と詳細（デザイン Note / NoteIncome / NotePair / RecordEdit）。
//
// 上から「‹ カテゴリ｜選んだカテゴリのピル」「日付」「（共有なら）だれのお金で払った？」
// 「方法」「メモ」、下に金額とテンキー、登録ボタン。「他の日を選ぶ」の暦はチップの下に
// 開く（シートの上にシートを重ねない）。
//
// 共有モードはメモ必須（ペアに見える内容なので何の記録か分かるようにする）。
// 満たさないうちは登録ボタンの文言で理由を伝える。
//
// 編集は左が「キャンセル」で、ピルを押すと 1 枚目に戻ってカテゴリを選び直せる。
// 下端に削除が加わる。

export function AmountStep({
  state,
  isPair,
  editingId,
  selectedType,
  methods,
  methodId,
  today,
  onBack,
  onCancel,
  onSaved,
  patch
}: {
  state: NoteState;
  isPair: boolean;
  // 編集対象の id。新規のときは undefined。
  editingId?: number;
  selectedType: TypeCard;
  methods: MethodCard[];
  // 候補に対して正規化済みの方法 id（state のそれではなくこちらを送る）。
  methodId: number | null;
  today: string;
  onBack: () => void;
  onCancel: () => void;
  // 登録・更新・削除が成功したとき。呼び出し側でシートを閉じて月を取り直す。
  onSaved: () => void;
  patch: (next: Partial<NoteState>) => void;
}) {
  const [result, action, isPending] = useFormAction(upsertRecordAction);
  const [form] = useForm({
    lastResult: result?.submission,
    onValidate: ({ formData }) =>
      parseWithZod(formData, { schema: recordUpsertSchema })
  });
  useEffect(() => {
    if (result?.toast?.type === 'success') {
      onSaved();
    }
  }, [result, onSaved]);
  // 検証エラーの多くは hidden に付くので、フォーム全体のエラーとしてまとめて出す。
  const errorMessages = [...new Set(Object.values(form.allErrors).flat())];

  const showInstead = isPair && state.isPay;
  const needsMemo = isPair && state.memo.trim() === '';
  const canSubmit = methodId !== null && state.price > 0 && !needsMemo;
  const isEdit = editingId !== undefined;

  return (
    <form
      {...getFormProps(form)}
      action={action}
      className='flex flex-col gap-3.5'
    >
      {isEdit ? (
        <input name='id' readOnly type='hidden' value={editingId} />
      ) : null}
      <HiddenFields isPair={isPair} methodId={methodId} state={state} />

      <SheetHeader
        back={isEdit ? undefined : { label: 'カテゴリ', onClick: onBack }}
        onCancel={onCancel}
        title={
          <TypePill
            isPair={isPair}
            isPay={state.isPay}
            onClick={onBack}
            selectedType={selectedType}
            subTypeId={state.subTypeId}
          />
        }
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

      <MethodField
        isPay={state.isPay}
        methodId={methodId}
        methods={methods}
        onChange={(next) => patch({ methodId: next })}
      />

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

      <SubmitBar
        canSubmit={canSubmit}
        editingId={editingId}
        isPending={isPending}
        needsMemo={needsMemo}
        onDeleted={onSaved}
      />
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

// 選んだカテゴリの丸いピル。押すと 1 枚目に戻る（選び直しの導線）。
function TypePill({
  isPay,
  isPair,
  selectedType,
  subTypeId,
  onClick
}: {
  isPay: boolean;
  isPair: boolean;
  selectedType: TypeCard;
  subTypeId: number | null;
  onClick: () => void;
}) {
  const subName = selectedType.subTypes.find((sub) => sub.id === subTypeId);
  return (
    <button
      className='flex h-9 max-w-full items-center gap-2 rounded-full bg-card px-3.5 text-foreground'
      onClick={onClick}
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

// 今日・昨日・おとといのチップと、それ以外の日を選ぶ暦。暦はチップの下に開く。
function DateField({
  value,
  today,
  onChange
}: {
  value: string;
  today: string;
  onChange: (date: string) => void;
}) {
  const [isPicking, setIsPicking] = useState(false);
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
          aria-expanded={isPicking}
          aria-label='他の日を選ぶ'
          className={cn(
            'flex size-9 shrink-0 items-center justify-center rounded-full',
            isPicking ? 'bg-muted text-foreground' : 'bg-card text-foreground'
          )}
          onClick={() => setIsPicking((prev) => !prev)}
          type='button'
        >
          <IconCalendar aria-hidden='true' className='size-4' />
        </button>
      </div>
      {isPicking ? (
        <div className='flex justify-center rounded-[14px] bg-card py-2'>
          <Calendar
            {...calendarJaProps}
            autoFocus
            className='bg-transparent'
            defaultMonth={parseLocalDate(value)}
            mode='single'
            onSelect={(next) => {
              // 同じ日を押すと undefined が来る（選択解除）。日付は必須なので無視する。
              if (next === undefined) {
                return;
              }
              onChange(formatLocalDate(next));
              setIsPicking(false);
            }}
            selected={parseLocalDate(value)}
          />
        </div>
      ) : null}
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

function MethodField({
  isPay,
  methods,
  methodId,
  onChange
}: {
  isPay: boolean;
  methods: MethodCard[];
  methodId: number | null;
  onChange: (methodId: number) => void;
}) {
  return (
    <Field label={`${isPay ? '支払' : '受取'}方法`}>
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
              onClick={() => onChange(method.id)}
            >
              {method.name}
            </Chip>
          ))}
        </div>
      )}
    </Field>
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
        'flex h-14 items-baseline justify-end gap-1.5 px-1 tabular-nums',
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

// 登録／保存と、編集のときだけ左に削除。共有でメモが空のときは文言で理由を伝える。
function SubmitBar({
  editingId,
  canSubmit,
  needsMemo,
  isPending,
  onDeleted
}: {
  editingId?: number;
  canSubmit: boolean;
  needsMemo: boolean;
  isPending: boolean;
  onDeleted: () => void;
}) {
  const verb = editingId === undefined ? '登録' : '保存';
  return (
    <div className='flex gap-2.5'>
      {editingId === undefined ? null : (
        <DeleteButton id={editingId} onDeleted={onDeleted} />
      )}
      <button
        className={cn(
          'h-13 flex-grow rounded-xl font-bold text-[17px]',
          canSubmit
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted font-semibold text-[15px] text-muted-foreground'
        )}
        disabled={!canSubmit || isPending}
        type='submit'
      >
        {needsMemo ? `メモを入れると${verb}できます` : `${verb}する`}
      </button>
    </div>
  );
}

// 削除。保存の左に置く正方形の赤いボタン。確認は共通の ConfirmDialog。
function DeleteButton({
  id,
  onDeleted
}: {
  id: number;
  onDeleted: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<FormActionResult | null>(null);
  useFormToast(result);

  const remove = () => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set('id', String(id));
      const next = await deleteRecordAction(null, formData);
      setResult(next);
      if (next.toast?.type === 'success') {
        onDeleted();
      }
    });
  };

  return (
    <ConfirmDialog
      onConfirm={remove}
      size='sm'
      solidConfirm
      title={recordLabels.confirm.delete}
      trigger={
        <button
          aria-label='この記録を削除'
          className='flex size-13 shrink-0 items-center justify-center rounded-xl bg-destructive/12 text-destructive disabled:opacity-50'
          disabled={isPending}
          type='button'
        >
          <IconTrash aria-hidden='true' className='size-5' />
        </button>
      }
    />
  );
}
