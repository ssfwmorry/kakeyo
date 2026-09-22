'use client';

import { getFormProps, useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod/v4';
import { useMemo, useState } from 'react';
import { useFormAction } from '@/components/form/use-form-action';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { colorHex } from '@/features/master';
import type {
  GroupedMethodList,
  GroupedTypeList,
  MethodCard,
  SubTypeCard,
  TypeCard
} from '@/features/type-method';
import { todayJst } from '@/lib/shared/domain/date';
import { L } from '@/lib/shared/labels';
import {
  deleteRecordAction,
  upsertRecordAction
} from '../actions/record-actions';
import { recordLabels } from '../labels';
import { recordUpsertSchema } from '../schemas/record-schema';

// note（記録入力）の record 部分の UI（Client Component）。
// type/method は @/features/type-method の barrel 経由で受け取り（内部直参照しない）。
// 収支/立替/カテゴリ/サブカテゴリ/方法/日付/メモ/金額を選び、Conform の hidden で
// Server Action へ送る。record_type/所有者導出は Server（service）に委ねる。
// ペアモード（共有 ON/OFF）は Server が Cookie から読むが、UI 出し分けのため
// isPair を props で受ける（自前で Cookie を読まない）。

// note が編集時に受け取る初期値（record 1 件分）。新規時は undefined。
export type NoteRecordDefault = {
  id: number;
  isPay: boolean;
  date: string;
  methodId: number;
  typeId: number | null;
  subTypeId: number | null;
  memo: string | null;
  price: number;
  isInstead: boolean;
};

type NoteRecordFormProps = {
  typeList: GroupedTypeList;
  methodList: GroupedMethodList;
  // 現在の共有モード（Cookie 由来。Server から渡す）。
  isPair: boolean;
  editing?: NoteRecordDefault;
};

// 入力状態（旧 note.vue の ref 群）をまとめて扱うためのローカル型。
type NoteState = {
  isPay: boolean;
  date: string;
  typeId: number | null;
  subTypeId: number | null;
  methodId: number | null;
  isInstead: boolean;
  memo: string;
  price: string;
};

const selectClassName =
  'flex h-9 w-full items-center rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none';

export function NoteRecordForm({
  typeList,
  methodList,
  isPair,
  editing
}: NoteRecordFormProps) {
  const [state, setState] = useState<NoteState>(() => toInitialState(editing));
  const patch = (next: Partial<NoteState>) =>
    setState((prev) => ({ ...prev, ...next }));

  const view = useNoteView(typeList, methodList, isPair, state);
  // 収支/立替の切替時は選択をリセットする（旧 resetInput）。
  const resetSelection = () =>
    patch({ typeId: null, subTypeId: null, methodId: null });

  return (
    <div className='flex flex-col gap-6'>
      <NoteHeader
        isPay={state.isPay}
        date={state.date}
        onPayChange={(isPay) => patch({ isPay })}
        onDateChange={(date) => patch({ date })}
        onReset={resetSelection}
      />

      <NoteSelectionArea
        view={view}
        subTypeId={state.subTypeId}
        onSelectType={(typeId) => patch({ typeId, subTypeId: null })}
        onSelectSubType={(subTypeId) => patch({ subTypeId })}
        onReset={resetSelection}
      />

      {view.isTypeChosen ? (
        <NoteDetailForm
          state={state}
          isPair={isPair}
          editing={editing}
          methods={view.methods}
          patch={patch}
        />
      ) : null}

      {editing ? <NoteDeleteForm id={editing.id} /> : null}
    </div>
  );
}

// 状態から表示に必要な派生値をまとめて算出する（本体の複雑度を下げる）。
type NoteView = {
  types: TypeCard[];
  methods: MethodCard[];
  selectedType: TypeCard | null;
  subTypes: SubTypeCard[];
  hasSubType: boolean;
  isTypeChosen: boolean;
  showSubTypeGrid: boolean;
};

function useNoteView(
  typeList: GroupedTypeList,
  methodList: GroupedMethodList,
  isPair: boolean,
  state: NoteState
): NoteView {
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
function NoteSelectionArea({
  view,
  subTypeId,
  onSelectType,
  onSelectSubType,
  onReset
}: {
  view: NoteView;
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

// 方法・立替・メモ・金額・登録ボタンの本体フォーム。
function NoteDetailForm({
  state,
  isPair,
  editing,
  methods,
  patch
}: {
  state: NoteState;
  isPair: boolean;
  editing?: NoteRecordDefault;
  methods: MethodCard[];
  patch: (next: Partial<NoteState>) => void;
}) {
  const [result, action] = useFormAction(upsertRecordAction);
  const [form] = useForm({
    lastResult: result?.submission,
    onValidate: ({ formData }) =>
      parseWithZod(formData, { schema: recordUpsertSchema })
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
      <NoteHiddenFields state={state} isPair={isPair} editing={editing} />
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
        id='note-memo'
        label='メモ'
        value={state.memo}
        placeholder={recordLabels.placeholder.memo}
        onChange={(memo) => patch({ memo })}
      />
      <TextInputRow
        id='note-price'
        label='金額'
        value={state.price}
        placeholder={recordLabels.placeholder.price}
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
        {editing ? recordLabels.action.update : recordLabels.action.create}
      </Button>
    </form>
  );
}

// 削除フォーム（編集時のみ・別 form）。成功時は redirect するため戻り値は届かない。
function NoteDeleteForm({ id }: { id: number }) {
  const [deleteResult, deleteAction] = useFormAction(deleteRecordAction);
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
function toInitialState(editing?: NoteRecordDefault): NoteState {
  return {
    isPay: editing?.isPay ?? true,
    date: editing?.date ?? todayJst(),
    typeId: editing?.typeId ?? null,
    subTypeId: editing?.subTypeId ?? null,
    methodId: editing?.methodId ?? null,
    // 立替は既定 ON（旧 note 踏襲）。共有 & 支出のときのみ意味を持つ。
    isInstead: editing?.isInstead ?? true,
    memo: editing?.memo ?? '',
    price: editing?.price === undefined ? '' : String(editing.price)
  };
}

// 送信可否: カテゴリ確定・方法選択済み・共有時はメモ必須（旧 note の disabled 条件）。
function canSubmit(state: NoteState, isPair: boolean): boolean {
  if (state.methodId === null) {
    return false;
  }
  return !isPair || state.memo.trim() !== '';
}

// ===== 子コンポーネント（複雑度を分割） =====

function NoteHeader({
  isPay,
  date,
  onPayChange,
  onDateChange,
  onReset
}: {
  isPay: boolean;
  date: string;
  onPayChange: (isPay: boolean) => void;
  onDateChange: (date: string) => void;
  onReset: () => void;
}) {
  const choose = (next: boolean) => {
    onPayChange(next);
    onReset();
  };
  return (
    <div className='flex items-center justify-between gap-4'>
      <div className='flex gap-2'>
        <Button
          type='button'
          variant={isPay ? 'default' : 'outline'}
          onClick={() => choose(true)}
        >
          {recordLabels.payToggle.pay}
        </Button>
        <Button
          type='button'
          variant={!isPay ? 'default' : 'outline'}
          onClick={() => choose(false)}
        >
          {recordLabels.payToggle.income}
        </Button>
      </div>
      <div className='flex flex-col gap-1'>
        <Label htmlFor='note-date'>日付</Label>
        <Input
          id='note-date'
          type='date'
          value={date}
          min='2000-01-01'
          max='2099-12-31'
          onChange={(event) => onDateChange(event.target.value)}
        />
      </div>
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
        {recordLabels.empty.noTypeMethod}
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
        <Label htmlFor='note-method'>方法</Label>
        <select
          id='note-method'
          value={methodId ?? ''}
          onChange={(event) =>
            onMethodChange(
              event.target.value === '' ? null : Number(event.target.value)
            )
          }
          className={selectClassName}
        >
          <option value=''>{recordLabels.placeholder.selectMethod}</option>
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
          {recordLabels.instead}
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
function NoteHiddenFields({
  state,
  isPair,
  editing
}: {
  state: NoteState;
  isPair: boolean;
  editing?: NoteRecordDefault;
}) {
  // 立替は共有 & 支出のときのみ意味を持つ。それ以外は false で送る。
  const insteadValue = isPair && state.isPay ? state.isInstead : false;
  return (
    <>
      {editing ? (
        <input type='hidden' name='id' value={editing.id} readOnly />
      ) : null}
      <input type='hidden' name='date' value={state.date} readOnly />
      <input type='hidden' name='isPay' value={String(state.isPay)} readOnly />
      <input type='hidden' name='isPair' value={String(isPair)} readOnly />
      <input
        type='hidden'
        name='isInstead'
        value={String(insteadValue)}
        readOnly
      />
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
