'use client';

import { getFormProps, useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod/v4';
import { cn } from 'cn';
import { useEffect, useState, useTransition } from 'react';
import { useFormAction } from '@/components/form/use-form-action';
import { useSubmissionErrorToast } from '@/components/form/use-submission-error-toast';
import {
  IconCalendar,
  IconChevronLeft,
  IconChevronRight,
  IconMemo,
  IconUpdate
} from '@/components/icons';
import { SheetHeader, SheetTrashButton } from '@/components/sheet-header';
import { ConfirmAlert } from '@/components/ui/confirm-alert';
import { InlineCalendar } from '@/components/ui/inline-calendar';
import { RoundIconButton } from '@/components/ui/round-icon-button';
import { Segment } from '@/components/ui/segment';
import type { NoteRecordDefault } from '@/features/record';
import { recordLabels } from '@/features/record/labels';
import { recordUpsertSchema } from '@/features/record/schemas/record-schema';
import type { MethodCard, TypeCard } from '@/features/type-method';
import { addDaysJst } from '@/lib/shared/domain/date';
import {
  formatMonthDayWeekJa,
  formatSignedPrice
} from '@/lib/shared/domain/format';
import { formatLocalDate, parseLocalDate } from '@/lib/shared/domain/localDate';
import { showToast } from '@/lib/shared/toast/show-toast';
import type { Id } from '@/lib/shared/types/id';
import { deleteRecordAction, upsertRecordAction } from '../actions';
import {
  type EditableDateRange,
  editableDateRange
} from '../domain/editable-dates';
import { relativeDayLabel } from '../domain/relative-day';
import { AmountRow } from './amount-row';
import { Keypad } from './keypad';
import { FieldLabel, MethodPills } from './method-pills';
import type { NoteState } from './note-state';
import { TypePill, typeLabel } from './type-pill';

// 入力② 金額と詳細（原典 Note / NoteIncome / NotePair）。
//
// 上から「‹｜カテゴリのピル」「日付とメモのカード」「方法」、下に金額とテンキーと
// 送信バー。金額行に mt-auto を置いて、上の内容が短くてもテンキーが下に張り付く。
//
// 共有モードはメモ必須（ペアに見える内容なので何の記録か分かるようにする）。
// 満たさないうちは送信ボタンの文言で理由を伝える。
//
// 編集（原典 RecordEdit）も同じ画面で、左が×・右がゴミ箱になる。定期の記録から作られた
// 記録は日付を同じ月の中にだけ動かせるので、カードの下にその案内を出し、前後の日と暦を
// 月の中に留める。

const INSTEAD_OPTIONS = [
  { value: 'instead', label: '自分が立替', sub: 'あとで精算する' },
  { value: 'shared', label: '共有のお金', sub: '精算しない' }
] as const;

export function AmountStep({
  state,
  isPair,
  editing,
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
  // 編集対象。新規のときは undefined。
  editing?: NoteRecordDefault;
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

  const editingId = editing?.id;
  const isFromPlanned = editing?.plannedRecordId != null;
  const dateRange = editableDateRange({
    savedDate: editing?.date,
    isFromPlanned,
    today
  });

  const showInstead = isPair && state.isPay;
  const needsMemo = isPair && state.memo.trim() === '';
  const hasPrice = state.price > 0;
  const canSubmit = methodId !== null && hasPrice && !needsMemo;

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
            <DeleteButton
              description={deleteDescription(state, selectedType)}
              id={editingId}
              onDeleted={onSaved}
            />
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
          range={dateRange}
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
      {isFromPlanned ? <PlannedBanner /> : null}

      <MethodField
        isEditing={editingId !== undefined}
        isInstead={state.isInstead}
        isPay={state.isPay}
        methodId={methodId}
        methods={methods}
        patch={patch}
        showInstead={showInstead}
      />

      <AmountRow
        isPay={state.isPay}
        label={`${state.isPay ? recordLabels.payToggle.pay : recordLabels.payToggle.income}の金額`}
        onClear={() => patch({ price: 0 })}
        price={state.price}
      />
      <Keypad onChange={(price) => patch({ price })} value={state.price} />

      <SubmitBar
        action={action}
        canSubmit={canSubmit}
        hasPrice={hasPrice}
        isEditing={editingId !== undefined}
        isPending={isPending}
        needsMemo={needsMemo}
      />
    </form>
  );
}

// 削除の確認の本文。画面に見えている日付・カテゴリ・金額をそのまま読み上げる
// （原典 RecordEdit の confirm と同じ）。
function deleteDescription(state: NoteState, selectedType: TypeCard): string {
  const target = `${typeLabel(selectedType, state.subTypeId)} ${formatSignedPrice(state.price, state.isPay)}円`;
  return `${formatMonthDayWeekJa(state.date)}の「${target}」を削除します。削除すると元に戻せません。`;
}

// 定期の記録から作られた記録の案内。日付が同じ月に留まる理由を伝える。
function PlannedBanner() {
  return (
    <div className='-mt-2 flex shrink-0 items-center gap-2 rounded-[10px] bg-secondary px-3 py-2'>
      <IconUpdate
        aria-hidden='true'
        className='size-4 shrink-0 text-primary'
        strokeWidth={2.2}
      />
      <span className='text-[12px] text-foreground leading-normal'>
        定期の記録から作られた記録です。日付は同じ月の中でだけ変えられます。
      </span>
    </div>
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

// 日付。前後 1 日は丸ボタン、離れた日は暦を行の下に展開して選ぶ。
// 動かせる範囲（range）の外には出さない。前後のボタンは端で無効にし、暦も端の外を選べなくする。
function DateRow({
  value,
  today,
  range,
  onChange
}: {
  value: string;
  today: string;
  range: EditableDateRange;
  onChange: (date: string) => void;
}) {
  const [isPicking, setIsPicking] = useState(false);
  const relative = relativeDayLabel(value, today);
  const canGoPrev = range.min === null || value > range.min;
  const canGoNext = value < range.max;

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
            {...calendarBounds(range)}
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
    </>
  );
}

// 暦に渡す範囲。端の外の日は選べなくする。下限があるとき（定期由来）は月を跨いで
// 見せる意味が無いので、暦の月送りも止める。
function calendarBounds(range: EditableDateRange): {
  disabled: ({ after: Date } | { before: Date })[];
  startMonth?: Date;
  endMonth?: Date;
} {
  const maxDate = parseLocalDate(range.max);
  const minDate = range.min === null ? undefined : parseLocalDate(range.min);
  const disabled = [
    ...(maxDate === undefined ? [] : [{ after: maxDate }]),
    ...(minDate === undefined ? [] : [{ before: minDate }])
  ];
  if (minDate === undefined) {
    return { disabled };
  }
  return { disabled, startMonth: minDate, endMonth: maxDate };
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
// 新規は前回の方法が入っていることをラベルで伝える。編集は保存済みの方法なので付けない。
function MethodField({
  showInstead,
  isInstead,
  isPay,
  isEditing,
  methods,
  methodId,
  patch
}: {
  showInstead: boolean;
  isInstead: boolean;
  isPay: boolean;
  isEditing: boolean;
  methods: MethodCard[];
  methodId: Id | null;
  patch: (next: Partial<NoteState>) => void;
}) {
  const methodLabel = isPay ? '支払方法' : '受取方法';
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
          {isEditing ? methodLabel : `${methodLabel}（前回の方法を自動で選択）`}
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

// ヘッダー右のゴミ箱。中央のアラートで確かめてから消す。
//
// トーストは useFormToast（effect で発火）ではなくここで直に出す。成功すると
// モーダルごと閉じてこの部品が消えるため、effect まで到達しない。
function DeleteButton({
  id,
  description,
  onDeleted
}: {
  id: Id;
  description: string;
  onDeleted: () => void;
}) {
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
        description={description}
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
// 押せない理由はメモ → 金額の順で 1 つだけ出す。
function SubmitBar({
  action,
  canSubmit,
  needsMemo,
  hasPrice,
  isEditing,
  isPending
}: {
  action: (formData: FormData) => void;
  canSubmit: boolean;
  needsMemo: boolean;
  hasPrice: boolean;
  isEditing: boolean;
  isPending: boolean;
}) {
  const verb = isEditing ? '保存' : '登録';
  const label = needsMemo
    ? `メモを入れると${verb}できます`
    : hasPrice
      ? `${verb}する`
      : `金額を入れると${verb}できます`;
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
        {label}
      </button>
    </div>
  );
}
