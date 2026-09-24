'use client';

import { getFormProps, useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod/v4';
import { useState } from 'react';
import { DeleteButton } from '@/components/form/delete-button';
import { MethodRow } from '@/components/form/method-row';
import { PriceKeypad } from '@/components/form/price-keypad';
import { SubmitButton } from '@/components/form/submit-button';
import { TextInputRow } from '@/components/form/text-input-row';
import { useFormAction } from '@/components/form/use-form-action';
import { IconMemo, IconUpdate } from '@/components/icons';
import { SectionHeading } from '@/components/section-heading';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { DayClassification } from '@/features/master';
import type {
  GroupedMethodList,
  GroupedTypeList,
  MethodCard
} from '@/features/type-method';
import { TypeSelectionArea, useTypeSelection } from '@/features/type-method';
import { L } from '@/lib/shared/labels';
import {
  deletePlannedRecordAction,
  upsertPlannedRecordAction
} from '../actions';
import { plannedRecordLabels } from '../labels';
import { plannedRecordUpsertSchema } from '../schemas';
import type { NotePlannedRecordDefault } from '../types';

// note（定期入力）の planned_record 部分の UI（Client Component）。
// 「日付」ではなく「毎月何日か（day_classification）」を選ぶ。
// type/method・day は各 feature の barrel 経由で受け取る（内部直参照しない）。
// record_type/所有者導出は Server（service）に委ねる。
// 編集時の isPair は編集対象の共有状態で固定する（編集中の共有切替は禁止）。

type NotePlannedRecordFormProps = {
  typeList: GroupedTypeList;
  methodList: GroupedMethodList;
  dayClassifications: DayClassification[];
  // 共有モード。Server が解決済みの値を渡す（新規は Cookie のモード、編集は
  // 対象自身の共有区分）。
  isPair: boolean;
  editing?: NotePlannedRecordDefault;
};

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
  isPair,
  editing
}: NotePlannedRecordFormProps) {
  const [state, setState] = useState<PlannedState>(() =>
    toInitialState(editing)
  );
  const patch = (next: Partial<PlannedState>) =>
    setState((prev) => ({ ...prev, ...next }));

  // 共有トグルは画面を再マウントせず isPair だけ差し替えるため、旧モードのカテゴリ・
  // 方法が残る。render 中に前回値と比べて捨てる（effect では 1 フレーム残る）。
  // 編集時の isPair は editing 固定なので、これが効くのは実質新規のときだけ。
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
  const resetSelection = () =>
    patch({ typeId: null, subTypeId: null, methodId: null });

  return (
    <div className='flex flex-col gap-6'>
      {/* この画面に定期を示すタブが無いので、見出しが唯一の現在地の手がかりになる。 */}
      <SectionHeading icon={IconUpdate} as='h1' mutedIcon>
        {plannedRecordLabels.heading.plannedRecord}
      </SectionHeading>

      <PlannedHeader
        isPay={state.isPay}
        onPayChange={(isPay) => patch({ isPay })}
        onReset={resetSelection}
      />

      <TypeSelectionArea
        view={view}
        subTypeId={state.subTypeId}
        emptyMessage={plannedRecordLabels.empty.noTypeMethod}
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

      {editing && view.isTypeChosen ? (
        <DeleteButton
          id={editing.id}
          action={deletePlannedRecordAction}
          description={plannedRecordLabels.confirm.delete}
        />
      ) : null}
    </div>
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
  const [result, action, isPending] = useFormAction(upsertPlannedRecordAction);
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
        label={plannedRecordLabels.field.method}
        insteadLabel={plannedRecordLabels.instead}
        emptyMessage={plannedRecordLabels.empty.noMethod}
        showInstead={isPair && state.isPay}
        isInstead={state.isInstead}
        onMethodChange={(methodId) => patch({ methodId })}
        // 立替の切替は方法候補（self/pair）を変えるため方法選択をクリアする。
        onInsteadChange={(isInstead) => patch({ isInstead, methodId: null })}
      />
      <TextInputRow
        id='planned-memo'
        label={plannedRecordLabels.field.memo}
        icon={IconMemo}
        value={state.memo}
        placeholder={plannedRecordLabels.placeholder.memo}
        onChange={(memo) => patch({ memo })}
      />
      <PriceKeypad
        label={plannedRecordLabels.field.price}
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
        disabled={!canSubmit(state, isPair)}
      >
        {editing ? L.button.update : L.button.create}
      </SubmitButton>
    </form>
  );
}

function toInitialState(editing?: NotePlannedRecordDefault): PlannedState {
  return {
    isPay: editing?.isPay ?? true,
    dayClassificationId: editing?.dayClassificationId ?? null,
    typeId: editing?.typeId ?? null,
    subTypeId: editing?.subTypeId ?? null,
    methodId: editing?.methodId ?? null,
    // 立替は既定 ON。
    isInstead: editing?.isInstead ?? true,
    memo: editing?.memo ?? '',
    price: editing?.price === undefined ? '' : String(editing.price)
  };
}

// 送信可否: 毎月何日か確定・カテゴリ確定・方法選択済み・共有時はメモ必須。
function canSubmit(state: PlannedState, isPair: boolean): boolean {
  if (state.dayClassificationId === null || state.methodId === null) {
    return false;
  }
  return !isPair || state.memo.trim() !== '';
}

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
    <Tabs
      value={isPay ? 'pay' : 'income'}
      onValueChange={(value) => choose(value === 'pay')}
    >
      <TabsList className='h-9'>
        <TabsTrigger value='pay' className='px-4'>
          {plannedRecordLabels.payToggle.pay}
        </TabsTrigger>
        <TabsTrigger value='income' className='px-4'>
          {plannedRecordLabels.payToggle.income}
        </TabsTrigger>
      </TabsList>
    </Tabs>
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
