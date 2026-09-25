'use client';

import { getFormProps, useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod/v4';
import { cn } from 'cn';
import { useEffect, useState, useTransition } from 'react';
import { useFormAction } from '@/components/form/use-form-action';
import {
  IconCalendar,
  IconChevronLeft,
  IconChevronRight,
  IconMemo,
  IconRotateCcw
} from '@/components/icons';
import { colorVar } from '@/features/master';
import { recordLabels } from '@/features/record/labels';
import { recordUpsertSchema } from '@/features/record/schemas/record-schema';
import type { MethodCard, TypeCard } from '@/features/type-method';
import { addDaysJst } from '@/lib/shared/domain/date';
import { formatLocalDate, parseLocalDate } from '@/lib/shared/domain/localDate';
import type { Id } from '@/lib/shared/types/id';
import { SheetHeader, SheetTrashButton } from '@/v2/components/sheet-header';
import { ConfirmAlert } from '@/v2/components/ui/confirm-alert';
import { InlineCalendar } from '@/v2/components/ui/inline-calendar';
import { RoundIconButton } from '@/v2/components/ui/round-icon-button';
import { Segment } from '@/v2/components/ui/segment';
import { formatMonthDayWeekJa } from '@/v2/lib/format';
import { useSubmissionErrorToast } from '@/v2/lib/submission-error';
import { showToast } from '@/v2/lib/toast';
import { deleteRecordAction, upsertRecordAction } from '../actions';
import { relativeDayLabel } from '../domain/relative-day';
import { Keypad } from './keypad';
import type { NoteState } from './note-state';

// 入力② 金額と詳細（原典 Note / NoteIncome / NotePair）。
//
// 上から「‹｜カテゴリのピル」「日付とメモのカード」「方法」、下に金額とテンキーと
// 送信バー。金額行に mt-auto を置いて、上の内容が短くてもテンキーが下に張り付く。
//
// 共有モードはメモ必須（ペアに見える内容なので何の記録か分かるようにする）。
// 満たさないうちは送信ボタンの文言で理由を伝える。

const INSTEAD_OPTIONS = [
  { value: 'instead', label: '自分が立替', sub: 'あとで精算する' },
  { value: 'shared', label: '共有のお金', sub: '精算しない' }
] as const;

export function AmountStep({
  state,
  isPair,
  editingId,
  selectedType,
  methods,
  methodId,
  today,
  onBack,
  onClose,
  onSaved,
  patch
}: {
  state: NoteState;
  isPair: boolean;
  // 編集対象の id。新規のときは undefined。
  editingId?: Id;
  selectedType: TypeCard;
  methods: MethodCard[];
  // 候補に対して正規化済みの方法 id（state のそれではなくこちらを送る）。
  methodId: Id | null;
  today: string;
  onBack: () => void;
  onClose: () => void;
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
  // 検証エラーの多くは hidden に付くので、画面に出さずトーストでまとめて伝える。
  useSubmissionErrorToast(result);

  const showInstead = isPair && state.isPay;
  const needsMemo = isPair && state.memo.trim() === '';
  const canSubmit = methodId !== null && state.price > 0 && !needsMemo;

  return (
    <form
      {...getFormProps(form)}
      className='flex min-h-0 flex-1 flex-col gap-3.5'
    >
      {editingId === undefined ? null : (
        <input name='id' readOnly type='hidden' value={editingId} />
      )}
      <HiddenFields isPair={isPair} methodId={methodId} state={state} />

      <SheetHeader
        // 編集は①へ戻る道をピルに持たせ、左は閉じるにする。
        left={editingId === undefined ? { back: 'カテゴリに戻る' } : 'close'}
        onLeft={editingId === undefined ? onBack : onClose}
        right={
          editingId === undefined ? undefined : (
            <DeleteButton id={editingId} onDeleted={onSaved} />
          )
        }
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

      <div className='shrink-0 overflow-hidden rounded-[14px] bg-card'>
        <DateRow
          onChange={(date) => patch({ date })}
          today={today}
          value={state.date}
        />
        <MemoRow
          isPair={isPair}
          isRequired={needsMemo}
          onChange={(memo) => patch({ memo })}
          value={state.memo}
        />
      </div>

      <MethodField
        isInstead={state.isInstead}
        isPay={state.isPay}
        methodId={methodId}
        methods={methods}
        patch={patch}
        showInstead={showInstead}
      />

      <AmountRow
        isPay={state.isPay}
        onClear={() => patch({ price: 0 })}
        price={state.price}
      />
      <Keypad onChange={(price) => patch({ price })} value={state.price} />

      <SubmitBar
        action={action}
        canSubmit={canSubmit}
        isEditing={editingId !== undefined}
        isPending={isPending}
        needsMemo={needsMemo}
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
  methodId: Id | null;
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

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className='font-semibold text-[12px] text-muted-foreground'>
      {children}
    </span>
  );
}

// 選んだカテゴリの丸いピル。押すと①に戻る（選び直しの導線）。
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
  subTypeId: Id | null;
  onClick: () => void;
}) {
  const subName = selectedType.subTypes.find((sub) => sub.id === subTypeId);
  return (
    <button
      aria-label='カテゴリを変える'
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

// 日付。前後 1 日は丸ボタン、離れた日は暦を行の下に展開して選ぶ。
// 未来の記録は付けられないので、次の日は今日で止める。
function DateRow({
  value,
  today,
  onChange
}: {
  value: string;
  today: string;
  onChange: (date: string) => void;
}) {
  const [isPicking, setIsPicking] = useState(false);
  const relative = relativeDayLabel(value, today);
  const canGoNext = value < today;
  const todayDate = parseLocalDate(today);

  return (
    <>
      <div className='flex h-13 items-center gap-2.5 py-0 pr-2 pl-3.5'>
        <IconCalendar
          aria-hidden='true'
          className='size-4.5 shrink-0 text-muted-foreground'
        />
        <span className='w-[34px] shrink-0 text-[14px] text-muted-foreground'>
          {recordLabels.field.date}
        </span>
        <button
          aria-expanded={isPicking}
          aria-label='日付を選ぶ'
          className='flex h-11 min-w-0 flex-grow items-center gap-2 text-foreground'
          onClick={() => setIsPicking((prev) => !prev)}
          type='button'
        >
          <span className='whitespace-nowrap font-semibold text-[16px]'>
            {formatMonthDayWeekJa(value)}
          </span>
          {relative === null ? null : (
            <span className='flex h-5 shrink-0 items-center rounded-[10px] bg-secondary px-[7px] font-bold text-[11px] text-primary'>
              {relative}
            </span>
          )}
        </button>
        <RoundIconButton
          aria-label='前の日'
          onClick={() => onChange(addDaysJst(value, -1))}
          tone='soft'
        >
          <IconChevronLeft
            aria-hidden='true'
            className='size-4'
            strokeWidth={2.4}
          />
        </RoundIconButton>
        <RoundIconButton
          aria-label='次の日'
          disabled={!canGoNext}
          onClick={() => onChange(addDaysJst(value, 1))}
          tone='soft'
        >
          <IconChevronRight
            aria-hidden='true'
            className={cn('size-4', !canGoNext && 'text-icon-muted')}
            strokeWidth={2.4}
          />
        </RoundIconButton>
      </div>
      {isPicking ? (
        <div className='flex justify-center border-line-soft border-t pb-1'>
          <InlineCalendar
            defaultMonth={parseLocalDate(value)}
            // 未来の記録は付けられないので、今日より後は選べなくする。
            disabled={
              todayDate === undefined ? undefined : { after: todayDate }
            }
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
    </>
  );
}

function MemoRow({
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
    <label
      className={cn(
        'flex h-13 items-center gap-2.5 border-line-soft border-t px-3.5',
        // 未入力を促す輪郭。エラーの赤そのものだと失敗の表示に見えるので薄める。
        isRequired &&
          'shadow-[inset_0_0_0_1.5px_color-mix(in_srgb,var(--destructive)_45%,var(--card))]'
      )}
    >
      <IconMemo
        aria-hidden='true'
        className='size-4.5 shrink-0 text-muted-foreground'
      />
      <span className='flex w-[34px] shrink-0 flex-col leading-tight'>
        <span className='text-[14px] text-muted-foreground'>
          {recordLabels.field.memo}
        </span>
        {isPair ? (
          <span className='font-bold text-[10px] text-destructive'>必須</span>
        ) : null}
      </span>
      <input
        aria-label={
          isPair ? 'メモ（必須・ペアに見える内容）' : recordLabels.field.memo
        }
        className='min-w-0 flex-grow bg-transparent text-[16px] text-foreground outline-none'
        onChange={(event) => onChange(event.target.value)}
        placeholder={isPair ? '例：週末の買い出し' : '任意'}
        type='text'
        value={value}
      />
    </label>
  );
}

// 方法の候補。共有の支出だけは、その前に「だれのお金で払った？」で候補ごと切り替える。
function MethodField({
  showInstead,
  isInstead,
  isPay,
  methods,
  methodId,
  patch
}: {
  showInstead: boolean;
  isInstead: boolean;
  isPay: boolean;
  methods: MethodCard[];
  methodId: Id | null;
  patch: (next: Partial<NoteState>) => void;
}) {
  return (
    <div className='flex shrink-0 flex-col gap-1.5'>
      {showInstead ? (
        <>
          <FieldLabel>だれのお金で払った？</FieldLabel>
          <Segment
            label='だれのお金で払った？'
            onChange={(value) =>
              // 立替かどうかで方法の候補が入れ替わるので、選択を捨てて選び直させる。
              patch({ isInstead: value === 'instead', methodId: null })
            }
            options={INSTEAD_OPTIONS}
            size='xl'
            value={isInstead ? 'instead' : 'shared'}
          />
        </>
      ) : (
        <FieldLabel>
          {isPay ? '支払方法' : '受取方法'}（前回の方法を自動で選択）
        </FieldLabel>
      )}
      <MethodPills
        methodId={methodId}
        methods={methods}
        onChange={(next) => patch({ methodId: next })}
      />
    </div>
  );
}

function MethodPills({
  methods,
  methodId,
  onChange
}: {
  methods: MethodCard[];
  methodId: Id | null;
  onChange: (methodId: Id) => void;
}) {
  if (methods.length === 0) {
    return (
      <p className='px-1 text-muted-foreground text-sm'>
        {recordLabels.empty.noMethod}
      </p>
    );
  }
  return (
    <div className='-mx-4 flex gap-2 overflow-x-auto px-4'>
      {methods.map((method) => {
        const isSelected = method.id === methodId;
        return (
          <button
            aria-pressed={isSelected}
            className={cn(
              'flex h-9 shrink-0 items-center whitespace-nowrap rounded-full px-3.5 font-semibold text-[14px]',
              isSelected
                ? 'bg-primary text-primary-foreground'
                : 'bg-card text-foreground'
            )}
            key={method.id}
            onClick={() => onChange(method.id)}
            type='button'
          >
            {method.name}
          </button>
        );
      })}
    </div>
  );
}

// 金額。支出は「−」で文字色、収入は「+」でアクセント。
function AmountRow({
  isPay,
  price,
  onClear
}: {
  isPay: boolean;
  price: number;
  onClear: () => void;
}) {
  return (
    <div className='mt-auto flex h-14 shrink-0 items-center gap-2 px-1'>
      <button
        aria-label='金額を0にする'
        className='flex h-9 shrink-0 items-center gap-1.5 rounded-[18px] bg-muted py-0 pr-3.5 pl-[11px] font-semibold text-[13px] text-foreground'
        onClick={onClear}
        type='button'
      >
        <IconRotateCcw
          aria-hidden='true'
          className='size-[15px]'
          strokeWidth={2.4}
        />
        クリア
      </button>
      <output
        aria-label={`${isPay ? recordLabels.payToggle.pay : recordLabels.payToggle.income}の金額`}
        className={cn(
          'flex min-w-0 flex-grow items-baseline justify-end gap-1.5 tabular-nums',
          isPay ? 'text-foreground' : 'text-primary'
        )}
      >
        <span className='whitespace-nowrap font-bold text-[44px] tracking-[-0.01em]'>
          {isPay ? '−' : '+'}
          {price.toLocaleString('ja-JP')}
        </span>
        <span className='font-semibold text-lg'>円</span>
      </output>
    </div>
  );
}

// ヘッダー右のゴミ箱。中央のアラートで確かめてから消す。
//
// トーストは useFormToast（effect で発火）ではなくここで直に出す。成功すると
// モーダルごと閉じてこの部品が消えるため、effect まで到達しない。
function DeleteButton({ id, onDeleted }: { id: Id; onDeleted: () => void }) {
  const [isPending, startTransition] = useTransition();
  const [isConfirming, setIsConfirming] = useState(false);

  const remove = () => {
    setIsConfirming(false);
    startTransition(async () => {
      const formData = new FormData();
      formData.set('id', String(id));
      const result = await deleteRecordAction(null, formData);
      if (result.toast) {
        showToast(result.toast);
      }
      if (result.toast?.type === 'success') {
        onDeleted();
      }
    });
  };

  return (
    <>
      <SheetTrashButton
        disabled={isPending}
        label='この記録を削除'
        onClick={() => setIsConfirming(true)}
      />
      <ConfirmAlert
        onCancel={() => setIsConfirming(false)}
        onConfirm={remove}
        open={isConfirming}
        pending={isPending}
        title='この記録を削除しますか？'
      />
    </>
  );
}

// 全高固定シートの保存バー。シートの左右余白を打ち消して地を端まで伸ばす。
function SubmitBar({
  action,
  canSubmit,
  needsMemo,
  isEditing,
  isPending
}: {
  action: (formData: FormData) => void;
  canSubmit: boolean;
  needsMemo: boolean;
  isEditing: boolean;
  isPending: boolean;
}) {
  const verb = isEditing ? '保存' : '登録';
  return (
    <div
      className='-mx-4 shrink-0 bg-background px-4 pt-2.5'
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 34px)' }}
    >
      <button
        className={cn(
          'h-13 w-full rounded-xl font-bold text-[17px]',
          canSubmit
            ? 'bg-primary text-primary-foreground'
            : 'bg-disabled font-semibold text-[15px] text-muted-foreground'
        )}
        disabled={!canSubmit || isPending}
        formAction={action}
        type='submit'
      >
        {needsMemo ? `メモを入れると${verb}できます` : `${verb}する`}
      </button>
    </div>
  );
}
