'use client';

import { getFormProps, useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod/v4';
import { type ReactNode, useMemo, useState, useTransition } from 'react';
import type { ZodType } from 'zod';
import { useCloseOnSuccess } from '@/components/form/use-close-on-success';
import { useFormAction } from '@/components/form/use-form-action';
import { useFormToast } from '@/components/form/use-form-toast';
import type { ColorClassification } from '@/features/master';
import type { FormActionResult } from '@/lib/shared/types/formResult';
import { SheetHeader, SheetTrashButton } from '@/v2/components/sheet-header';
import {
  BottomSheet,
  BottomSheetContent
} from '@/v2/components/ui/bottom-sheet';
import { ColorGrid } from '@/v2/components/ui/color-grid';
import { ConfirmAlert } from '@/v2/components/ui/confirm-alert';
import { SheetSubmitButton } from '@/v2/components/ui/sheet-submit-button';
import { TextField } from '@/v2/components/ui/text-field';
import { quoted } from '@/v2/lib/format';

// 「名前 + 色」だけを持つマスタ（方法・予定カテゴリ・口座。サブカテゴリは名前だけ）の
// 追加・編集シート。データの形が同じなので UI も 1 つに揃える。構成は原典 SetBank の
// シートに合わせる:
//
//   グラバー → ×｜「◯◯を追加／編集」｜ゴミ箱（編集時） → 名前（文字数カウンタ付き）
//   → 補足 → 色（36px の丸） → 主ボタン「追加する／保存する」
//
// 主ボタンは名前が空のあいだ押せず、押せない理由を文字にする（必須エラーは出さない）。
// 削除はゴミ箱 → 中央の確認 → 実行。紐づくデータがあって消せないときは、
// トーストではなく「削除できません」のアラートで理由を説明してシートは開いたままにする
// （予定カテゴリだけは原典がトーストなので onForeignKey で切り替える）。
//
// フォームの作りは既存と同じ「1 フォーム = 1 スキーマ = 1 useForm」。編集対象が
// 変わっても useForm の defaultValue はマウント時にしか取り込まれないため、
// 呼び出し側は対象の id で key を変えてこのコンポーネントごと作り直す。

type DeleteAction = (
  prev: FormActionResult | null,
  formData: FormData
) => Promise<FormActionResult>;

// 紐づくデータがあって削除できなかったときの出し方。
export type ForeignKeyHandling =
  | {
      kind: 'alert';
      // 「「{名前}」には記録があります。名前と色の変更はできます。」
      description: (name: string) => string;
    }
  | {
      kind: 'toast';
      // 「「{名前}」を使っている予定があるので削除できません」
      message: (name: string) => string;
    };

export function MasterSheet<Schema extends ZodType>({
  isOpen,
  onOpenChange,
  entity,
  editing,
  nameLabel = '名前',
  namePlaceholder,
  maxLength = 10,
  helper,
  colors,
  hiddenFields,
  upsertAction,
  upsertSchema,
  deleteAction,
  onForeignKey,
  onDeleted,
  children
}: {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  // 「支払方法」「予定カテゴリ」「口座」「サブカテゴリ」。見出し・ボタン・確認の文言に使う。
  entity: string;
  // 編集対象。追加のときは undefined。
  editing?: { id: number; name: string; colorClassificationId?: number };
  // 名前欄のラベル。「名前」か「口座名」。
  nameLabel?: string;
  namePlaceholder?: string;
  maxLength?: number;
  // 名前欄の下の補足。追加と編集で違う文を出せる。
  helper?: string | { create: string; edit: string };
  // 省略すると色の欄を出さない（サブカテゴリ）。
  colors?: ColorClassification[];
  // hidden で送る値（isPair / payMode / typeId など）。
  hiddenFields?: Record<string, string>;
  upsertAction: (
    prev: FormActionResult | null,
    formData: FormData
  ) => Promise<FormActionResult>;
  upsertSchema: Schema;
  // 省略すると削除の入口を出さない。
  deleteAction?: DeleteAction;
  onForeignKey?: ForeignKeyHandling;
  onDeleted?: () => void;
  // 名前欄と色のあいだに差し込む要素。
  children?: ReactNode;
}) {
  const [result, action, isSaving] = useFormAction(upsertAction);
  const [form, fields] = useForm({
    lastResult: result?.submission,
    onValidate: ({ formData }) =>
      parseWithZod(formData, { schema: upsertSchema })
  });
  useCloseOnSuccess(result, onOpenChange);

  const isEdit = editing !== undefined;
  const [name, setName] = useState(editing?.name ?? '');
  const canSave = name.trim() !== '';
  const verb = isEdit ? '保存' : '追加';
  const helperText = resolveHelper(helper, isEdit);

  const remove = useDeleteFlow({
    deleteAction,
    id: editing?.id,
    name: editing?.name ?? '',
    onForeignKey,
    onDeleted: () => {
      onOpenChange(false);
      onDeleted?.();
    }
  });

  return (
    <BottomSheet onOpenChange={onOpenChange} open={isOpen}>
      <BottomSheetContent>
        <SheetHeader
          left='close'
          onLeft={() => onOpenChange(false)}
          right={
            isEdit && deleteAction !== undefined ? (
              <SheetTrashButton
                disabled={remove.isPending}
                label={`この${entity}を削除`}
                onClick={remove.ask}
              />
            ) : undefined
          }
          title={`${entity}を${isEdit ? '編集' : '追加'}`}
        />

        <form
          {...getFormProps(form)}
          action={action}
          className='flex flex-col gap-3.5'
        >
          <HiddenFields fields={hiddenFields} id={editing?.id} />

          <div className='flex flex-col gap-1.5'>
            <TextField
              counter
              errorId={fields.name.errorId}
              errors={fields.name.errors}
              height={52}
              key={fields.name.key}
              label={nameLabel}
              maxLength={maxLength}
              name={fields.name.name}
              onChange={(event) => setName(event.target.value)}
              placeholder={namePlaceholder}
              value={name}
            />
            {helperText !== undefined ? (
              <p className='px-1 text-muted-foreground text-xs leading-relaxed'>
                {helperText}
              </p>
            ) : null}
          </div>

          {children}

          {colors !== undefined ? (
            <ColorGrid
              colors={colors}
              defaultColorId={editing?.colorClassificationId}
              errorId={fields.colorId.errorId}
              errors={fields.colorId.errors}
              label='色'
              name={fields.colorId.name}
              size={36}
            />
          ) : null}

          <SheetSubmitButton
            className='mt-1'
            disabled={!canSave || isSaving}
            disabledLabel={`${nameLabel}を入れると${verb}できます`}
            label={`${verb}する`}
          />
        </form>

        {editing !== undefined ? (
          <DeleteAlerts
            entity={entity}
            name={editing.name}
            onForeignKey={onForeignKey}
            remove={remove}
          />
        ) : null}
      </BottomSheetContent>
    </BottomSheet>
  );
}

function resolveHelper(
  helper: string | { create: string; edit: string } | undefined,
  isEdit: boolean
): string | undefined {
  if (typeof helper === 'string' || helper === undefined) {
    return helper;
  }
  return isEdit ? helper.edit : helper.create;
}

function HiddenFields({
  fields,
  id
}: {
  fields?: Record<string, string>;
  id?: number;
}) {
  return (
    <>
      {Object.entries(fields ?? {}).map(([key, value]) => (
        <input key={key} name={key} readOnly type='hidden' value={value} />
      ))}
      {id !== undefined ? (
        <input name='id' readOnly type='hidden' value={id} />
      ) : null}
    </>
  );
}

// 削除の確認と、紐づきがあって消せないときの説明。
function DeleteAlerts({
  entity,
  name,
  onForeignKey,
  remove
}: {
  entity: string;
  name: string;
  onForeignKey?: ForeignKeyHandling;
  remove: ReturnType<typeof useDeleteFlow>;
}) {
  return (
    <>
      <ConfirmAlert
        description={`${quoted(name)}を削除します。削除すると元に戻せません。`}
        onCancel={remove.cancel}
        onConfirm={remove.run}
        open={remove.isConfirming}
        pending={remove.isPending}
        title={`この${entity}を削除しますか？`}
      />
      {onForeignKey?.kind === 'alert' ? (
        <ConfirmAlert
          description={onForeignKey.description(name)}
          onCancel={remove.dismissBlocked}
          onConfirm={remove.dismissBlocked}
          open={remove.isBlocked}
          title={`この${entity}は削除できません`}
          variant='ok'
        />
      ) : null}
    </>
  );
}

// 削除の一連の状態。確認 → 実行 → 成功なら閉じる／紐づきがあれば説明。
function useDeleteFlow({
  deleteAction,
  id,
  name,
  onForeignKey,
  onDeleted
}: {
  deleteAction?: DeleteAction;
  id?: number;
  name: string;
  onForeignKey?: ForeignKeyHandling;
  onDeleted: () => void;
}) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<FormActionResult | null>(null);

  // 紐づきエラーをアラートで出すときはトーストを鳴らさない。トーストで出すときは
  // 対象名入りの文言に差し替える。
  const toastResult = useMemo(() => {
    if (result?.error !== 'foreignKey' || onForeignKey === undefined) {
      return result;
    }
    if (onForeignKey.kind === 'alert') {
      return null;
    }
    return {
      toast: { type: 'error' as const, message: onForeignKey.message(name) }
    };
  }, [result, onForeignKey, name]);
  useFormToast(toastResult);

  const run = () => {
    if (deleteAction === undefined || id === undefined) {
      return;
    }
    setIsConfirming(false);
    startTransition(async () => {
      const formData = new FormData();
      formData.set('id', String(id));
      const next = await deleteAction(null, formData);
      setResult(next);
      if (next.toast?.type === 'success') {
        onDeleted();
      } else if (
        next.error === 'foreignKey' &&
        onForeignKey?.kind === 'alert'
      ) {
        setIsBlocked(true);
      }
    });
  };

  return {
    isConfirming,
    isBlocked,
    isPending,
    ask: () => setIsConfirming(true),
    cancel: () => setIsConfirming(false),
    dismissBlocked: () => setIsBlocked(false),
    run
  };
}
