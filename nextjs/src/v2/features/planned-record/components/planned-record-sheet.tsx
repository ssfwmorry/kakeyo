'use client';

import { getFormProps, useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod/v4';
import { useEffect, useState, useTransition } from 'react';
import { useFormAction } from '@/components/form/use-form-action';
import { IconMemo, IconUpdate } from '@/components/icons';
import type { DayClassification } from '@/features/master';
import type { NotePlannedRecordDefault } from '@/features/planned-record';
import { plannedRecordUpsertSchema } from '@/features/planned-record/schemas';
import { recordLabels } from '@/features/record/labels';
import type {
  GroupedMethodList,
  GroupedTypeList,
  TypeCard
} from '@/features/type-method';
import { useTypeSelection } from '@/features/type-method';
import { formatDateLabelJst } from '@/lib/shared/domain/date';
import type { Id } from '@/lib/shared/types/id';
import { SheetHeader, SheetTrashButton } from '@/v2/components/sheet-header';
import {
  BottomSheet,
  BottomSheetContent
} from '@/v2/components/ui/bottom-sheet';
import { ConfirmAlert } from '@/v2/components/ui/confirm-alert';
import { Segment } from '@/v2/components/ui/segment';
import { SheetSubmitButton } from '@/v2/components/ui/sheet-submit-button';
import { AmountRow } from '@/v2/features/note/components/amount-row';
import { Keypad } from '@/v2/features/note/components/keypad';
import {
  FieldLabel,
  MethodPills
} from '@/v2/features/note/components/method-pills';
import { TypePill, typeLabel } from '@/v2/features/note/components/type-pill';
import { TypeGrid } from '@/v2/features/note/components/type-step';
import { useSubmissionErrorToast } from '@/v2/lib/submission-error';
import { showToast } from '@/v2/lib/toast';
import { deletePlannedRecordAction, savePlannedRecordAction } from '../actions';
import { nextPlannedRecordDate } from '../domain/next-record-date';

// 定期の記録の追加・編集シート（原典 SetPlanned の追加／追加の詳細／編集）。
//
// 入力フローと同じ 2 段構成をひとつの全高シートの中で切り替える。カテゴリの格子・
// 方法のピル・金額とテンキーは入力フローの部品をそのまま使い、日付の代わりに
// 「毎月何日か」のセグメントを置く。
//
// 追加はカテゴリから始まり、編集は詳細から始まる。詳細のピルを押すとカテゴリへ戻れて、
// そこからは「‹ 詳細に戻る」で選び直さずに戻れる。

const PAY_OPTIONS = [
  { value: 'pay', label: recordLabels.payToggle.pay },
  { value: 'income', label: recordLabels.payToggle.income }
] as const;

const INSTEAD_OPTIONS = [
  { value: 'instead', label: '自分が立替', sub: 'あとで精算する' },
  { value: 'shared', label: '共有のお金', sub: '精算しない' }
] as const;

type PlannedState = {
  isPay: boolean;
  dayClassificationId: Id;
  typeId: Id | null;
  subTypeId: Id | null;
  methodId: Id | null;
  isInstead: boolean;
  memo: string;
  price: number;
};

type Step = { kind: 'type'; fromDetail: boolean } | { kind: 'detail' };

export function PlannedRecordSheet({
  editing,
  isPair,
  typeList,
  methodList,
  dayClassifications,
  today,
  onClose,
  onSaved
}: {
  // 編集対象。追加のときは undefined。
  editing?: NotePlannedRecordDefault;
  // 追加は今のモード、編集は対象自身の区分（登録後に切り替えられない）。
  isPair: boolean;
  typeList: GroupedTypeList;
  methodList: GroupedMethodList;
  dayClassifications: DayClassification[];
  today: string;
  onClose: () => void;
  // 保存・削除が成功したとき。呼び出し側がシートを閉じる。
  onSaved: () => void;
}) {
  const [state, setState] = useState<PlannedState>(() => ({
    isPay: editing?.isPay ?? true,
    dayClassificationId:
      editing?.dayClassificationId ?? dayClassifications[0]?.id ?? 0,
    typeId: editing?.typeId ?? null,
    subTypeId: editing?.subTypeId ?? null,
    methodId: editing?.methodId ?? null,
    isInstead: editing?.isInstead ?? true,
    memo: editing?.memo ?? '',
    price: editing?.price ?? 0
  }));
  const [step, setStep] = useState<Step>(
    editing === undefined
      ? { kind: 'type', fromDetail: false }
      : { kind: 'detail' }
  );
  const patch = (next: Partial<PlannedState>) =>
    setState((prev) => ({ ...prev, ...next }));

  const selection = useTypeSelection(typeList, methodList, isPair, state);
  // 候補に無い方法は先頭で埋める（立替の切替や収支の切替で候補が入れ替わるため）。
  const methodId = selection.methods.some((m) => m.id === state.methodId)
    ? state.methodId
    : (selection.methods[0]?.id ?? null);

  return (
    <BottomSheet onOpenChange={(isOpen) => !isOpen && onClose()} open>
      <BottomSheetContent
        className='shadow-[0_-8px_24px_rgba(0,0,0,0.18)]'
        gap={step.kind === 'type' ? 12 : 14}
        size='full'
      >
        {step.kind === 'detail' && selection.selectedType !== null ? (
          <DetailStep
            dayClassifications={dayClassifications}
            editing={editing}
            isPair={isPair}
            methodId={methodId}
            methods={selection.methods}
            onChangeType={() => setStep({ kind: 'type', fromDetail: true })}
            onClose={onClose}
            onSaved={onSaved}
            onToType={() => {
              patch({ typeId: null, subTypeId: null });
              setStep({ kind: 'type', fromDetail: false });
            }}
            patch={patch}
            selectedType={selection.selectedType}
            state={state}
            today={today}
          />
        ) : (
          <TypeStep
            fromDetail={step.kind === 'type' && step.fromDetail}
            isPay={state.isPay}
            onBackToDetail={() => setStep({ kind: 'detail' })}
            onClose={onClose}
            onPayChange={(isPay) =>
              // 収支が変わるとカテゴリと方法の候補ごと入れ替わるため、選択を捨てる。
              patch({ isPay, typeId: null, subTypeId: null, methodId: null })
            }
            onPick={(typeId, subTypeId) => {
              patch({ typeId, subTypeId });
              setStep({ kind: 'detail' });
            }}
            selectedTypeId={state.typeId}
            types={selection.types}
          />
        )}
      </BottomSheetContent>
    </BottomSheet>
  );
}

// カテゴリを選ぶ。追加の入口と、詳細からの選び直しの両方。
function TypeStep({
  fromDetail,
  isPay,
  types,
  selectedTypeId,
  onClose,
  onBackToDetail,
  onPayChange,
  onPick
}: {
  fromDetail: boolean;
  isPay: boolean;
  types: TypeCard[];
  selectedTypeId: Id | null;
  onClose: () => void;
  onBackToDetail: () => void;
  onPayChange: (isPay: boolean) => void;
  onPick: (typeId: Id, subTypeId: Id | null) => void;
}) {
  const [expandedId, setExpandedId] = useState<Id | null>(null);
  return (
    <>
      <SheetHeader
        left={fromDetail ? { back: '詳細に戻る' } : 'close'}
        onLeft={fromDetail ? onBackToDetail : onClose}
        title={fromDetail ? 'カテゴリを変える' : '定期の記録を追加'}
      />
      <Segment
        label='収支'
        onChange={(value) => {
          setExpandedId(null);
          onPayChange(value === 'pay');
        }}
        options={PAY_OPTIONS}
        size='lg'
        value={isPay ? 'pay' : 'income'}
      />
      <div
        className='mt-1 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto'
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 34px)' }}
      >
        <span className='font-semibold text-[13px] text-muted-foreground'>
          カテゴリ
        </span>
        {types.length === 0 ? (
          <p className='px-1 text-muted-foreground text-sm'>
            {recordLabels.empty.noTypeMethod}
          </p>
        ) : (
          <TypeGrid
            expandedId={expandedId}
            onPick={onPick}
            onToggle={(typeId) =>
              setExpandedId((prev) => (prev === typeId ? null : typeId))
            }
            selectedId={selectedTypeId}
            types={types}
          />
        )}
      </div>
    </>
  );
}

// 毎月何日か・メモ・方法・金額を決めて保存する。
function DetailStep({
  state,
  isPair,
  editing,
  selectedType,
  methods,
  methodId,
  dayClassifications,
  today,
  onToType,
  onChangeType,
  onClose,
  onSaved,
  patch
}: {
  state: PlannedState;
  isPair: boolean;
  editing?: NotePlannedRecordDefault;
  selectedType: TypeCard;
  methods: {
    id: Id;
    name: string;
    colorClassificationId: Id;
    colorName: string;
    isPair: boolean;
  }[];
  methodId: Id | null;
  dayClassifications: DayClassification[];
  today: string;
  onToType: () => void;
  onChangeType: () => void;
  onClose: () => void;
  onSaved: () => void;
  patch: (next: Partial<PlannedState>) => void;
}) {
  const [result, action, isPending] = useFormAction(savePlannedRecordAction);
  const [form] = useForm({
    lastResult: result?.submission,
    onValidate: ({ formData }) =>
      parseWithZod(formData, { schema: plannedRecordUpsertSchema })
  });
  useEffect(() => {
    if (result?.toast?.type === 'success') {
      onSaved();
    }
  }, [result, onSaved]);
  useSubmissionErrorToast(result);

  const isEdit = editing !== undefined;
  const showInstead = isPair && state.isPay;
  const day =
    dayClassifications.find((item) => item.id === state.dayClassificationId)
      ?.value ?? null;
  const canSave = state.price > 0 && methodId !== null && day !== null;

  return (
    <form
      {...getFormProps(form)}
      className='flex min-h-0 flex-1 flex-col gap-3.5'
    >
      <HiddenFields
        id={editing?.id}
        isPair={isPair}
        methodId={methodId}
        state={state}
      />

      <DetailHeader
        day={day}
        editing={editing}
        isPair={isPair}
        onChangeType={onChangeType}
        onClose={onClose}
        onSaved={onSaved}
        onToType={onToType}
        selectedType={selectedType}
        state={state}
      />

      <div className='flex shrink-0 flex-col gap-1.5'>
        <div className='overflow-hidden rounded-[14px] bg-card'>
          <DayRow
            dayClassifications={dayClassifications}
            onChange={(dayClassificationId) => patch({ dayClassificationId })}
            value={state.dayClassificationId}
          />
          <MemoRow onChange={(memo) => patch({ memo })} value={state.memo} />
        </div>
        <NextHint day={day} today={today} />
      </div>

      {showInstead ? (
        <InsteadField
          isInstead={state.isInstead}
          onChange={(isInstead) =>
            // 立替かどうかで方法の候補が入れ替わるので、選択を捨てて先頭に戻す。
            patch({ isInstead, methodId: null })
          }
        />
      ) : null}

      <div className='flex shrink-0 flex-col gap-1.5'>
        <FieldLabel>{state.isPay ? '支払方法' : '受取方法'}</FieldLabel>
        <MethodPills
          methodId={methodId}
          methods={methods}
          onChange={(next) => patch({ methodId: next })}
        />
      </div>

      <AmountRow
        isPay={state.isPay}
        label='毎月の金額'
        onClear={() => patch({ price: 0 })}
        price={state.price}
      />
      <Keypad onChange={(price) => patch({ price })} value={state.price} />

      <div
        className='-mx-4 shrink-0 bg-background px-4 pt-2.5'
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 34px)' }}
      >
        <SheetSubmitButton
          disabled={!canSave || isPending}
          disabledLabel='金額を入れると登録できます'
          formAction={action}
          label={isEdit ? '変更を保存' : '登録する'}
        />
      </div>
    </form>
  );
}

// 「‹ カテゴリに戻る｜カテゴリのピル｜ゴミ箱」。追加は左が戻る、編集は左が閉じるで右にゴミ箱。
function DetailHeader({
  state,
  isPair,
  editing,
  selectedType,
  day,
  onToType,
  onChangeType,
  onClose,
  onSaved
}: {
  state: PlannedState;
  isPair: boolean;
  editing?: NotePlannedRecordDefault;
  selectedType: TypeCard;
  day: number | null;
  onToType: () => void;
  onChangeType: () => void;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = editing !== undefined;
  const title = typeLabel(selectedType, state.subTypeId);
  return (
    <SheetHeader
      left={isEdit ? 'close' : { back: 'カテゴリに戻る' }}
      onLeft={isEdit ? onClose : onToType}
      right={
        isEdit ? (
          <DeleteButton
            description={`${title}（毎月${day ?? ''}日）は来月から記録されなくなります。これまでに記録された分は残ります。`}
            id={editing.id}
            onDeleted={onSaved}
          />
        ) : undefined
      }
      title={
        <TypePill
          isPair={isPair}
          isPay={state.isPay}
          onClick={onChangeType}
          selectedType={selectedType}
          subTypeId={state.subTypeId}
        />
      }
    />
  );
}

// 「次は 10月25日 に自動で記録されます」。
function NextHint({ day, today }: { day: number | null; today: string }) {
  if (day === null) {
    return null;
  }
  return (
    <span className='px-1 text-[12px] text-muted-foreground'>
      次は {formatDateLabelJst(nextPlannedRecordDate(today, day))}{' '}
      に自動で記録されます
    </span>
  );
}

// 共有の支出だけに出る「だれのお金で払う？」。
function InsteadField({
  isInstead,
  onChange
}: {
  isInstead: boolean;
  onChange: (isInstead: boolean) => void;
}) {
  return (
    <div className='flex shrink-0 flex-col gap-1.5'>
      <FieldLabel>だれのお金で払う？</FieldLabel>
      <Segment
        label='だれのお金で払う？'
        onChange={(value) => onChange(value === 'instead')}
        options={INSTEAD_OPTIONS}
        size='xl'
        value={isInstead ? 'instead' : 'shared'}
      />
    </div>
  );
}

// Server Action へ送る hidden 群。record_type と所有者の導出は Server に委ねる。
function HiddenFields({
  id,
  state,
  isPair,
  methodId
}: {
  id?: Id;
  state: PlannedState;
  isPair: boolean;
  methodId: Id | null;
}) {
  // 立替は共有 & 支出のときだけ意味を持つ。それ以外は false で送る。
  const isInstead = isPair && state.isPay ? state.isInstead : false;
  return (
    <>
      {id === undefined ? null : (
        <input name='id' readOnly type='hidden' value={id} />
      )}
      <input
        name='dayClassificationId'
        readOnly
        type='hidden'
        value={String(state.dayClassificationId)}
      />
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

// 「毎月 ｜ 1日 10日 15日 25日」。候補は day_classifications の値。
function DayRow({
  dayClassifications,
  value,
  onChange
}: {
  dayClassifications: DayClassification[];
  value: Id;
  onChange: (dayClassificationId: Id) => void;
}) {
  return (
    <div className='flex h-13 items-center gap-2.5 py-0 pr-2 pl-3.5'>
      <IconUpdate
        aria-hidden='true'
        className='size-4.5 shrink-0 text-muted-foreground'
      />
      <span className='w-[34px] shrink-0 text-[14px] text-muted-foreground'>
        毎月
      </span>
      <Segment
        className='flex-grow'
        label='毎月の記録日'
        onChange={(next) => onChange(Number(next))}
        options={dayClassifications.map((day) => ({
          value: String(day.id),
          label: `${day.value}日`
        }))}
        size='lg'
        tone='background'
        value={String(value)}
      />
    </div>
  );
}

function MemoRow({
  value,
  onChange
}: {
  value: string;
  onChange: (memo: string) => void;
}) {
  return (
    <label className='flex h-13 items-center gap-2.5 border-line-soft border-t px-3.5'>
      <IconMemo
        aria-hidden='true'
        className='size-4.5 shrink-0 text-muted-foreground'
      />
      <span className='w-[34px] shrink-0 text-[14px] text-muted-foreground'>
        メモ
      </span>
      <input
        aria-label='メモ'
        className='min-w-0 flex-grow bg-transparent text-[16px] text-foreground outline-none'
        onChange={(event) => onChange(event.target.value)}
        placeholder='任意（例：動画サブスク）'
        type='text'
        value={value}
      />
    </label>
  );
}

// ヘッダー右のゴミ箱。中央のアラートで確かめてから消す。
// トーストはここで直に出す。成功するとシートごと閉じて effect まで届かないため。
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
      const result = await deletePlannedRecordAction(null, formData);
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
        label='この定期の記録を削除'
        onClick={() => setIsConfirming(true)}
      />
      <ConfirmAlert
        description={description}
        onCancel={() => setIsConfirming(false)}
        onConfirm={remove}
        open={isConfirming}
        pending={isPending}
        title='この定期の記録を削除しますか？'
      />
    </>
  );
}
