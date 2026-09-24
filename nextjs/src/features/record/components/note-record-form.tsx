'use client';

import { getFormProps, useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod/v4';
import { useState } from 'react';
import { DatePicker } from '@/components/form/date-picker';
import { DeleteButton } from '@/components/form/delete-button';
import { MethodRow } from '@/components/form/method-row';
import { PriceKeypad } from '@/components/form/price-keypad';
import { SubmitButton } from '@/components/form/submit-button';
import { TextInputRow } from '@/components/form/text-input-row';
import { useFormAction } from '@/components/form/use-form-action';
import { IconMemo } from '@/components/icons';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type {
  GroupedMethodList,
  GroupedTypeList,
  MethodCard
} from '@/features/type-method';
import { TypeSelectionArea, useTypeSelection } from '@/features/type-method';
import { todayJst } from '@/lib/shared/domain/date';
import { L } from '@/lib/shared/labels';
import {
  deleteRecordAction,
  upsertRecordAction
} from '../actions/record-actions';
import { recordLabels } from '../labels';
import { recordUpsertSchema } from '../schemas/record-schema';
import type { NoteRecordDefault } from '../types';

// note（記録入力）の record 部分の UI（Client Component）。
// type/method は @/features/type-method の barrel 経由で受け取り（内部直参照しない）。
// 収支/立替/カテゴリ/サブカテゴリ/方法/日付/メモ/金額を選び、Conform の hidden で
// Server Action へ送る。record_type/所有者導出は Server（service）に委ねる。
// ペアモード（共有 ON/OFF）は Server が Cookie から読むが、UI 出し分けのため
// isPair を props で受ける（自前で Cookie を読まない）。

type NoteRecordFormProps = {
  typeList: GroupedTypeList;
  methodList: GroupedMethodList;
  // 現在の共有モード（Cookie 由来。Server から渡す）。
  isPair: boolean;
  editing?: NoteRecordDefault;
  // 新規時の初期日付（YYYY-MM-DD）。calendar の選択日から遷移したときに渡る。
  // 編集時は editing の日付が優先される。未指定なら今日。
  initialDate?: string;
};

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

export function NoteRecordForm({
  typeList,
  methodList,
  isPair,
  editing,
  initialDate
}: NoteRecordFormProps) {
  const [state, setState] = useState<NoteState>(() =>
    toInitialState(editing, initialDate)
  );
  const patch = (next: Partial<NoteState>) =>
    setState((prev) => ({ ...prev, ...next }));

  // 共有トグルは画面を再マウントせず isPair だけ差し替えるため、旧モードのカテゴリ・
  // 方法が残る。render 中に前回値と比べて捨てる（effect では 1 フレーム残る）。
  const [prevIsPair, setPrevIsPair] = useState(isPair);
  if (prevIsPair !== isPair) {
    setPrevIsPair(isPair);
    setState((prev) => ({
      ...prev,
      typeId: null,
      subTypeId: null,
      methodId: null,
      isInstead: true
    }));
  }

  const view = useTypeSelection(typeList, methodList, isPair, state);
  // 候補に対して正規化済みの方法 id。state のそれではなくこちらを送信・表示に使う。
  const methodId = resolveMethodId(
    view.methods,
    state.methodId,
    editing !== undefined
  );
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

      <TypeSelectionArea
        view={view}
        subTypeId={state.subTypeId}
        emptyMessage={recordLabels.empty.noTypeMethod}
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
          methodId={methodId}
          patch={patch}
        />
      ) : null}

      {editing && view.isTypeChosen ? (
        <DeleteButton
          id={editing.id}
          action={deleteRecordAction}
          description={recordLabels.confirm.delete}
        />
      ) : null}
    </div>
  );
}

// 候補（収支・立替・共有から導出される）に対して選択中の方法を解決する。
// 未選択なら先頭を初期値にする。先頭 = 設定画面の並び順なので、よく使う方法を上に置けば
// 1 タップも要らない。effect で追い掛けると旧候補が 1 フレーム残るため描画のたびに導出する。
//
// 編集中の記録が持つ方法が候補外のとき（記録の所有と共有モードが食い違う場合に起きる）は
// 先頭で埋めず未選択にする。黙って別の方法に置き換えると、ユーザーが方法を触っていないのに
// 保存済みの値が書き換わるため。未選択は canSubmit が止める。
function resolveMethodId(
  methods: MethodCard[],
  methodId: number | null,
  isEditing: boolean
): number | null {
  if (methodId !== null && methods.some((method) => method.id === methodId)) {
    return methodId;
  }
  if (isEditing && methodId !== null) {
    return null;
  }
  return methods[0]?.id ?? null;
}

// 方法・立替・メモ・金額・登録ボタンの本体フォーム。
function NoteDetailForm({
  state,
  isPair,
  editing,
  methods,
  methodId,
  patch
}: {
  state: NoteState;
  isPair: boolean;
  editing?: NoteRecordDefault;
  methods: MethodCard[];
  methodId: number | null;
  patch: (next: Partial<NoteState>) => void;
}) {
  const [result, action, isPending] = useFormAction(upsertRecordAction);
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
      <NoteHiddenFields
        state={state}
        isPair={isPair}
        editing={editing}
        methodId={methodId}
      />
      <MethodRow
        methods={methods}
        methodId={methodId}
        label={recordLabels.field.method}
        insteadLabel={recordLabels.instead}
        emptyMessage={recordLabels.empty.noMethod}
        showInstead={isPair && state.isPay}
        isInstead={state.isInstead}
        onMethodChange={(next) => patch({ methodId: next })}
        onInsteadChange={(isInstead) => patch({ isInstead })}
      />
      <TextInputRow
        id='note-memo'
        label={recordLabels.field.memo}
        icon={IconMemo}
        value={state.memo}
        placeholder={recordLabels.placeholder.memo}
        onChange={(memo) => patch({ memo })}
      />
      <PriceKeypad
        label={recordLabels.field.price}
        value={state.price}
        onChange={(price) => patch({ price })}
      />
      {errorMessages.length > 0 ? (
        <p className='text-sm text-red-600' role='alert'>
          {errorMessages.join(' / ')}
        </p>
      ) : null}
      <SubmitButton
        isPending={isPending}
        size='lg'
        className='h-12 w-full text-base'
        disabled={!canSubmit(state, isPair, methodId)}
      >
        {editing ? L.button.update : L.button.create}
      </SubmitButton>
    </form>
  );
}

function toInitialState(
  editing?: NoteRecordDefault,
  initialDate?: string
): NoteState {
  return {
    isPay: editing?.isPay ?? true,
    date: editing?.date ?? initialDate ?? todayJst(),
    typeId: editing?.typeId ?? null,
    subTypeId: editing?.subTypeId ?? null,
    methodId: editing?.methodId ?? null,
    // 立替は既定 ON。
    isInstead: editing?.isInstead ?? true,
    memo: editing?.memo ?? '',
    price: editing?.price === undefined ? '' : String(editing.price)
  };
}

// 送信可否: カテゴリ確定・方法選択済み・共有時はメモ必須。
function canSubmit(
  state: NoteState,
  isPair: boolean,
  methodId: number | null
): boolean {
  if (methodId === null) {
    return false;
  }
  return !isPair || state.memo.trim() !== '';
}

// 収支をタブで持つのは、選ぶと下のカテゴリグリッドが丸ごと入れ替わるため
// （値の二択ではなく表示の切替にあたる）。
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
  // 収支が変わるとカテゴリ候補ごと入れ替わるため、選択済みのカテゴリを捨てる。
  const choose = (next: boolean) => {
    onPayChange(next);
    onReset();
  };
  return (
    <div className='flex items-center justify-between gap-3'>
      <Tabs
        value={isPay ? 'pay' : 'income'}
        onValueChange={(value) => choose(value === 'pay')}
      >
        <TabsList className='h-9'>
          <TabsTrigger value='pay' className='px-4'>
            {recordLabels.payToggle.pay}
          </TabsTrigger>
          <TabsTrigger value='income' className='px-4'>
            {recordLabels.payToggle.income}
          </TabsTrigger>
        </TabsList>
      </Tabs>
      <DatePicker
        id='note-date'
        value={date}
        onChange={onDateChange}
        ariaLabel={recordLabels.field.date}
      />
    </div>
  );
}

// Server Action へ送る hidden 群（record_type/所有者導出は Server に委ねる）。
function NoteHiddenFields({
  state,
  isPair,
  editing,
  methodId
}: {
  state: NoteState;
  isPair: boolean;
  editing?: NoteRecordDefault;
  methodId: number | null;
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
      {methodId !== null ? (
        <input
          type='hidden'
          name='methodId'
          value={String(methodId)}
          readOnly
        />
      ) : null}
      <input type='hidden' name='memo' value={state.memo} readOnly />
      <input type='hidden' name='price' value={state.price} readOnly />
    </>
  );
}
