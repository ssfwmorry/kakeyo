'use client';

import { getFormProps, useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod/v4';
import { type ReactNode, useState } from 'react';
import type { ZodType } from 'zod';
import { useCloseOnSuccess } from '@/components/form/use-close-on-success';
import { useFormAction } from '@/components/form/use-form-action';
import type { ColorClassification } from '@/features/master';
import type { FormActionResult } from '@/lib/shared/types/formResult';
import {
  type DeleteAction,
  DeleteAlerts,
  type ForeignKeyHandling,
  useDeleteFlow
} from '@/v2/components/delete-flow';
import { SheetHeader, SheetTrashButton } from '@/v2/components/sheet-header';
import {
  BottomSheet,
  BottomSheetContent
} from '@/v2/components/ui/bottom-sheet';
import { ColorGrid } from '@/v2/components/ui/color-grid';
import { SheetSubmitButton } from '@/v2/components/ui/sheet-submit-button';
import { TextField } from '@/v2/components/ui/text-field';

// 「名前 + 色」だけを持つマスタ（方法・予定カテゴリ・口座。サブカテゴリは名前だけ）の
// 追加・編集シート。データの形が同じなので UI も 1 つに揃える。構成は原典 SetBank の
// シートに合わせる:
//
//   グラバー → ×｜「◯◯を追加／編集」｜ゴミ箱（編集時） → 名前（文字数カウンタ付き）
//   → 補足 → 色（36px の丸） → 主ボタン「追加する／保存する」
//
// 主ボタンは名前が空のあいだ押せず、押せない理由を文字にする（必須エラーは出さない）。
// 削除はゴミ箱 → 中央の確認 → 実行（delete-flow）。紐づくデータがあって消せないときは、
// トーストではなく「削除できません」のアラートで理由を説明してシートは開いたままにする
// （予定カテゴリだけは原典がトーストなので onForeignKey で切り替える）。
//
// フォームの作りは既存と同じ「1 フォーム = 1 スキーマ = 1 useForm」。編集対象が
// 変わっても useForm の defaultValue はマウント時にしか取り込まれないため、
// 呼び出し側は対象の id で key を変えてこのコンポーネントごと作り直す。

export type { ForeignKeyHandling };

export function MasterSheet<Schema extends ZodType>({
  isOpen,
  onOpenChange,
  entity,
  editing,
  nameLabel = '名前',
  nameAriaLabel,
  namePlaceholder,
  maxLength = 10,
  counter = true,
  nameHeight = 52,
  helper,
  colors,
  hiddenFields,
  upsertAction,
  upsertSchema,
  deleteAction,
  onForeignKey,
  isDeleteBlocked = false,
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
  // 名前欄のアクセシブルネーム。「予定カテゴリの名前」「方法の名前」など。省略時はラベル。
  nameAriaLabel?: string;
  namePlaceholder?: string;
  maxLength?: number;
  // 右端の文字数カウンタ。サブカテゴリ（名前だけ）は出さない。
  counter?: boolean;
  nameHeight?: 48 | 52;
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
  // 編集対象に紐づくデータがあって消せないことが分かっているとき（口座の残高）。
  // 確認の後、Action を呼ばずに onForeignKey の出し方で説明する。
  isDeleteBlocked?: boolean;
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
    onForeignKey,
    isKnownBlocked: () => isDeleteBlocked,
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
                onClick={() =>
                  remove.ask({ id: editing.id, name: editing.name })
                }
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
              aria-label={nameAriaLabel}
              counter={counter}
              errorId={fields.name.errorId}
              errors={fields.name.errors}
              height={nameHeight}
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
