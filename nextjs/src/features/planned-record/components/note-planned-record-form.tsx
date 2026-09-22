'use client';

import { getFormProps, useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod/v4';
import { useMemo, useState } from 'react';
import { useFormAction } from '@/components/form/use-form-action';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { DayClassification } from '@/features/master';
import { colorHex } from '@/features/master';
import type {
  GroupedMethodList,
  GroupedTypeList,
  MethodCard,
  SubTypeCard,
  TypeCard
} from '@/features/type-method';
import { L } from '@/lib/shared/labels';
import {
  deletePlannedRecordAction,
  upsertPlannedRecordAction
} from '../actions';
import { plannedRecordLabels } from '../labels';
import { plannedRecordUpsertSchema } from '../schemas';
import type { NotePlannedRecordDefault } from '../types';

// note（定期入力）の planned_record 部分の UI（Client Component）。
// record フォーム（NoteRecordForm）と同構造だが「日付」の代わりに
// 「毎月何日か（day_classification）」を選ぶ点だけ違う（fe-screens §NOTE）。
// type/method は @/features/type-method、day は @/features/master の barrel 経由で
// 受け取る（内部直参照しない）。record_type/所有者導出は Server（service）に委ねる。
// 編集時の isPair は編集対象の共有状態で固定する（旧 note は編集中の共有切替を禁止）。

type NotePlannedRecordFormProps = {
  typeList: GroupedTypeList;
  methodList: GroupedMethodList;
  dayClassifications: DayClassification[];
  // 現在の共有モード（Cookie 由来。Server から渡す）。新規時に使う。
  isPair: boolean;
  editing?: NotePlannedRecordDefault;
};

// 入力状態（旧 note.vue の ref 群）をまとめて扱うためのローカル型。
type PlannedState = {
  isPay: boolean;
  dayClassificationId: number | null;
  typeId: number | null;
  subTypeId: number | null;
  methodId: number | null;
  isInstead: boolean;
  memo: string;
  price: string;
};

const selectClassName =
  'flex h-9 w-full items-center rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none';

export function NotePlannedRecordForm({
  typeList,
  methodList,
  dayClassifications,
  isPair: currentPairMode,
  editing
}: NotePlannedRecordFormProps) {
  // 編集時は編集対象の共有状態で固定、新規時は現在のペアモードを使う。
  const isPair = editing ? editing.isPair : currentPairMode;
  const [state, setState] = useState<PlannedState>(() =>
    toInitialState(editing)
  );
  const patch = (next: Partial<PlannedState>) =>
    setState((prev) => ({ ...prev, ...next }));

  const view = usePlannedView(typeList, methodList, isPair, state);
  // 収支/立替の切替時は選択をリセットする（旧 resetInput）。
  const resetSelection = () =>
    patch({ typeId: null, subTypeId: null, methodId: null });

  return (
    <div className='flex flex-col gap-6'>
      <PlannedHeader
        isPay={state.isPay}
        onPayChange={(isPay) => patch({ isPay })}
        onReset={resetSelection}
      />

      <PlannedSelectionArea
        view={view}
        subTypeId={state.subTypeId}
        onSelectType={(typeId) => patch({ typeId, subTypeId: null })}
        onSelectSubType={(subTypeId) => patch({ subTypeId })}
        onReset={resetSelection}
      />

      {view.isTypeChosen ? (
        <PlannedDetailForm
          state={state}
          isPair={isPair}
          editing={editing}
          methods={view.methods}
          dayClassifications={dayClassifications}
          patch={patch}
        />
      ) : null}

      {editing ? <PlannedDeleteForm id={editing.id} /> : null}
    </div>
  );
}

// 状態から表示に必要な派生値をまとめて算出する（本体の複雑度を下げる）。
type PlannedView = {
  types: TypeCard[];
  methods: MethodCard[];
  selectedType: TypeCard | null;
  subTypes: SubTypeCard[];
  hasSubType: boolean;
  isTypeChosen: boolean;
  showSubTypeGrid: boolean;
};

function usePlannedView(
  typeList: GroupedTypeList,
  methodList: GroupedMethodList,
  isPair: boolean,
  state: PlannedState
): PlannedView {
  const payKey = state.isPay ? 'pay' : 'income';
  const ownerKey = isPair ? 'pair' : 'self';
  const types = typeList[payKey][ownerKey];
  // 方法は立替時は自分の方法（self）、共有非立替は pair の方法。
  const methods =
    methodList[payKey][isPair && !state.isInstead ? 'pair' : 'self'];
  const selectedType = useMemo(
    () => types.find((type) => type.id === state.typeId) ?? null,
    [types, state.typeId]
  );
  const subTypes = selectedType?.subTypes ?? [];
  const hasSubType = subTypes.length > 0;
  const isTypeChosen =
    state.typeId !== null && (!hasSubType || state.subTypeId !== null);
  const showSubTypeGrid =
    state.typeId !== null && hasSubType && state.subTypeId === null;
  return {
    types,
    methods,
    selectedType,
    subTypes,
    hasSubType,
    isTypeChosen,
    showSubTypeGrid
  };
}

// カテゴリ/サブカテゴリの選択エリア（未選択=グリッド、選択済=サマリ）。
function PlannedSelectionArea({
  view,
  subTypeId,
  onSelectType,
  onSelectSubType,
  onReset
}: {
  view: PlannedView;
  subTypeId: number | null;
  onSelectType: (typeId: number) => void;
  onSelectSubType: (subTypeId: number) => void;
  onReset: () => void;
}) {
  return (
    <>
      {view.isTypeChosen ? (
        <ChosenTypeSummary
          selectedType={view.selectedType}
          subTypes={view.subTypes}
          subTypeId={subTypeId}
          onReset={onReset}
        />
      ) : (
        <TypeGrid types={view.types} onSelect={onSelectType} />
      )}
      {view.showSubTypeGrid ? (
        <SubTypeGrid subTypes={view.subTypes} onSelect={onSelectSubType} />
      ) : null}
    </>
  );
}

// 毎月何日か・方法・立替・メモ・金額・登録ボタンの本体フォーム。
function PlannedDetailForm({
  state,
  isPair,
  editing,
  methods,
  dayClassifications,
  patch
}: {
  state: PlannedState;
  isPair: boolean;
  editing?: NotePlannedRecordDefault;
  methods: MethodCard[];
  dayClassifications: DayClassification[];
  patch: (next: Partial<PlannedState>) => void;
}) {
  const [result, action] = useFormAction(upsertPlannedRecordAction);
  const [form] = useForm({
    lastResult: result?.submission,
    onValidate: ({ formData }) =>
      parseWithZod(formData, { schema: plannedRecordUpsertSchema })
  });
  // 検証エラーの多く（typeId/methodId 等）は hidden フィールドに付くため、
  // フォーム全体のエラーとしてまとめて可視化する（サイレント失敗の防止）。
  const errorMessages = [...new Set(Object.values(form.allErrors).flat())];
  return (
    <form
      {...getFormProps(form)}
      action={action}
      className='flex flex-col gap-4'
    >
      <PlannedHiddenFields state={state} isPair={isPair} editing={editing} />
      <DayRow
        dayClassifications={dayClassifications}
        dayClassificationId={state.dayClassificationId}
        onChange={(dayClassificationId) => patch({ dayClassificationId })}
      />
      <MethodRow
        methods={methods}
        methodId={state.methodId}
        showInstead={isPair && state.isPay}
        isInstead={state.isInstead}
        onMethodChange={(methodId) => patch({ methodId })}
        // 立替の切替は方法候補（self/pair）を変えるため方法選択をクリアする。
        onInsteadChange={(isInstead) => patch({ isInstead, methodId: null })}
      />
      <TextInputRow
        id='planned-memo'
        label={plannedRecordLabels.field.memo}
        value={state.memo}
        placeholder={plannedRecordLabels.placeholder.memo}
        onChange={(memo) => patch({ memo })}
      />
      <TextInputRow
        id='planned-price'
        label={plannedRecordLabels.field.price}
        value={state.price}
        placeholder={plannedRecordLabels.placeholder.price}
        inputMode='numeric'
        onChange={(price) => patch({ price })}
      />
      {errorMessages.length > 0 ? (
        <p className='text-sm text-red-600' role='alert'>
          {errorMessages.join(' / ')}
        </p>
      ) : null}
      <Button
        type='submit'
        className='flex-1'
        disabled={!canSubmit(state, isPair)}
      >
        {editing
          ? plannedRecordLabels.action.update
          : plannedRecordLabels.action.create}
      </Button>
    </form>
  );
}

// 削除フォーム（編集時のみ・別 form）。成功時は redirect するため戻り値は届かない。
function PlannedDeleteForm({ id }: { id: number }) {
  const [deleteResult, deleteAction] = useFormAction(deletePlannedRecordAction);
  return (
    <form action={deleteAction}>
      <input type='hidden' name='id' value={id} readOnly />
      <Button type='submit' variant='destructive' className='w-full'>
        {L.button.delete}
      </Button>
      {/* 失敗時のみ toast が発火する（成功は redirect で消える）。 */}
      <span className='sr-only'>{deleteResult?.toast?.message ?? ''}</span>
    </form>
  );
}

// 初期状態を編集対象から組む（新規は既定値）。
function toInitialState(editing?: NotePlannedRecordDefault): PlannedState {
  return {
    isPay: editing?.isPay ?? true,
    dayClassificationId: editing?.dayClassificationId ?? null,
    typeId: editing?.typeId ?? null,
    subTypeId: editing?.subTypeId ?? null,
    methodId: editing?.methodId ?? null,
    // 立替は既定 ON（旧 note 踏襲）。共有 & 支出のときのみ意味を持つ。
    isInstead: editing?.isInstead ?? true,
    memo: editing?.memo ?? '',
    price: editing?.price === undefined ? '' : String(editing.price)
  };
}

// 送信可否: 毎月何日か確定・カテゴリ確定・方法選択済み・共有時はメモ必須
// （旧 note の disabled 条件を planned 用に合わせる）。
function canSubmit(state: PlannedState, isPair: boolean): boolean {
  if (state.dayClassificationId === null || state.methodId === null) {
    return false;
  }
  return !isPair || state.memo.trim() !== '';
}

// ===== 子コンポーネント（複雑度を分割） =====

function PlannedHeader({
  isPay,
  onPayChange,
  onReset
}: {
  isPay: boolean;
  onPayChange: (isPay: boolean) => void;
  onReset: () => void;
}) {
  const choose = (next: boolean) => {
    onPayChange(next);
    onReset();
  };
  return (
    <div className='flex gap-2'>
      <Button
        type='button'
        variant={isPay ? 'default' : 'outline'}
        onClick={() => choose(true)}
      >
        {plannedRecordLabels.payToggle.pay}
      </Button>
      <Button
        type='button'
        variant={!isPay ? 'default' : 'outline'}
        onClick={() => choose(false)}
      >
        {plannedRecordLabels.payToggle.income}
      </Button>
    </div>
  );
}

function TypeGrid({
  types,
  onSelect
}: {
  types: TypeCard[];
  onSelect: (typeId: number) => void;
}) {
  if (types.length === 0) {
    return (
      <p className='text-center text-sm text-muted-foreground'>
        {plannedRecordLabels.empty.noTypeMethod}
      </p>
    );
  }
  return (
    <div className='grid grid-cols-4 gap-3'>
      {types.map((type) => (
        <button
          key={type.id}
          type='button'
          className='flex flex-col items-center gap-1'
          onClick={() => onSelect(type.id)}
        >
          <span
            className='size-12 rounded-full'
            style={{ backgroundColor: colorHex(type.colorName) }}
          />
          <span className='text-xs'>{type.name}</span>
        </button>
      ))}
    </div>
  );
}

function ChosenTypeSummary({
  selectedType,
  subTypes,
  subTypeId,
  onReset
}: {
  selectedType: TypeCard | null;
  subTypes: SubTypeCard[];
  subTypeId: number | null;
  onReset: () => void;
}) {
  const subName =
    subTypeId === null
      ? ''
      : ` ＞ ${subTypes.find((sub) => sub.id === subTypeId)?.name ?? ''}`;
  return (
    <button
      type='button'
      className='self-start text-sm text-muted-foreground underline'
      onClick={onReset}
    >
      {selectedType?.name}
      {subName}（選び直す）
    </button>
  );
}

function SubTypeGrid({
  subTypes,
  onSelect
}: {
  subTypes: SubTypeCard[];
  onSelect: (subTypeId: number) => void;
}) {
  return (
    <div className='grid grid-cols-3 gap-2'>
      {subTypes.map((sub) => (
        <Button
          key={sub.id}
          type='button'
          variant='secondary'
          onClick={() => onSelect(sub.id)}
        >
          {sub.name}
        </Button>
      ))}
    </div>
  );
}

function DayRow({
  dayClassifications,
  dayClassificationId,
  onChange
}: {
  dayClassifications: DayClassification[];
  dayClassificationId: number | null;
  onChange: (dayClassificationId: number | null) => void;
}) {
  return (
    <div className='flex flex-col gap-1'>
      <Label htmlFor='planned-day'>{plannedRecordLabels.field.day}</Label>
      <select
        id='planned-day'
        value={dayClassificationId ?? ''}
        onChange={(event) =>
          onChange(
            event.target.value === '' ? null : Number(event.target.value)
          )
        }
        className={selectClassName}
      >
        <option value=''>{plannedRecordLabels.field.day}</option>
        {dayClassifications.map((day) => (
          <option key={day.id} value={day.id}>
            {day.name}
          </option>
        ))}
      </select>
    </div>
  );
}

function MethodRow({
  methods,
  methodId,
  showInstead,
  isInstead,
  onMethodChange,
  onInsteadChange
}: {
  methods: MethodCard[];
  methodId: number | null;
  showInstead: boolean;
  isInstead: boolean;
  onMethodChange: (methodId: number | null) => void;
  onInsteadChange: (isInstead: boolean) => void;
}) {
  return (
    <div className='flex items-end gap-4'>
      <div className='flex flex-1 flex-col gap-1'>
        <Label htmlFor='planned-method'>
          {plannedRecordLabels.field.method}
        </Label>
        <select
          id='planned-method'
          value={methodId ?? ''}
          onChange={(event) =>
            onMethodChange(
              event.target.value === '' ? null : Number(event.target.value)
            )
          }
          className={selectClassName}
        >
          <option value=''>
            {plannedRecordLabels.placeholder.selectMethod}
          </option>
          {methods.map((method) => (
            <option key={method.id} value={method.id}>
              {method.name}
            </option>
          ))}
        </select>
      </div>
      {showInstead ? (
        <label className='flex items-center gap-2 pb-2 text-sm'>
          <input
            type='checkbox'
            checked={isInstead}
            onChange={(event) => onInsteadChange(event.target.checked)}
          />
          {plannedRecordLabels.instead}
        </label>
      ) : null}
    </div>
  );
}

function TextInputRow({
  id,
  label,
  value,
  placeholder,
  inputMode,
  onChange
}: {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  inputMode?: 'numeric';
  onChange: (value: string) => void;
}) {
  return (
    <div className='flex flex-col gap-1'>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={value}
        placeholder={placeholder}
        inputMode={inputMode}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

// Server Action へ送る hidden 群（record_type/所有者導出は Server に委ねる）。
function PlannedHiddenFields({
  state,
  isPair,
  editing
}: {
  state: PlannedState;
  isPair: boolean;
  editing?: NotePlannedRecordDefault;
}) {
  // 立替は共有 & 支出のときのみ意味を持つ。それ以外は false で送る。
  const insteadValue = isPair && state.isPay ? state.isInstead : false;
  return (
    <>
      {editing ? (
        <input type='hidden' name='id' value={editing.id} readOnly />
      ) : null}
      <input type='hidden' name='isPay' value={String(state.isPay)} readOnly />
      <input type='hidden' name='isPair' value={String(isPair)} readOnly />
      <input
        type='hidden'
        name='isInstead'
        value={String(insteadValue)}
        readOnly
      />
      {state.dayClassificationId !== null ? (
        <input
          type='hidden'
          name='dayClassificationId'
          value={String(state.dayClassificationId)}
          readOnly
        />
      ) : null}
      <input
        type='hidden'
        name='typeId'
        value={String(state.typeId ?? '')}
        readOnly
      />
      {state.subTypeId !== null ? (
        <input
          type='hidden'
          name='subTypeId'
          value={String(state.subTypeId)}
          readOnly
        />
      ) : null}
      {state.methodId !== null ? (
        <input
          type='hidden'
          name='methodId'
          value={String(state.methodId)}
          readOnly
        />
      ) : null}
      <input type='hidden' name='memo' value={state.memo} readOnly />
      <input type='hidden' name='price' value={state.price} readOnly />
    </>
  );
}
