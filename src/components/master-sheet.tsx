'use client';

import { getFormProps, useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod/v4';
import { type ReactNode, useState } from 'react';
import type { ZodType } from 'zod';
import {
  type DeleteAction,
  DeleteAlerts,
  type ForeignKeyHandling,
  useDeleteFlow
} from '@/components/delete-flow';
import { useCloseOnSuccess } from '@/components/form/use-close-on-success';
import { useFormAction } from '@/components/form/use-form-action';
import { SheetHeader, SheetTrashButton } from '@/components/sheet-header';
import { BottomSheet, BottomSheetContent } from '@/components/ui/bottom-sheet';
import { ColorGrid } from '@/components/ui/color-grid';
import { SheetSubmitButton } from '@/components/ui/sheet-submit-button';
import { TextField } from '@/components/ui/text-field';
import type { ColorClassification } from '@/features/master';
import { dialogTitle } from '@/lib/shared/labels';
import type { FormActionResult } from '@/lib/shared/types/formResult';

// 「名前 + 色」だけを持つマスタ（方法・予定カテゴリ・口座・カテゴリの名前と色。
// サブカテゴリは名前だけ）の追加・編集フォーム。データの形が同じなので UI も 1 つに揃える。
// 構成は原典 SetBank のシートに合わせる。
//
// 主ボタンは名前が空のあいだ押せず、押せない理由を文字にする（必須エラーは出さない）。
// 削除はゴミ箱 → 中央の確認 → 実行（delete-flow）。紐づくデータがあって消せないときは、
// トーストではなく「削除できません」のアラートで理由を説明してシートは開いたままにする
// （予定カテゴリだけは原典がトーストなので onForeignKey で切り替える）。
//
// Drawer ごと出す MasterSheet と、中身だけの MasterSheetPanel に分かれている。
// カテゴリのシートのように 1 枚の Drawer の中でビューを切り替える画面は、
// Panel を自前の Drawer に載せて左上を「‹ 戻る」にする。

export type { ForeignKeyHandling };

type MasterSheetPanelProps<Schema extends ZodType> = {
  // 閉じる・保存できた・削除できた、のいずれかで呼ぶ。Drawer を閉じるか前のビューへ戻るかは呼び出し側が決める。
  onDone: () => void;
  // 左上。× か「‹ 戻る」。
  left?: 'close' | { back: string };
  // 左上を押したとき。省略時は onDone。
  onLeft?: () => void;
  // 見出し。省略時は「◯◯を追加／編集」。
  title?: string;
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
};

export function MasterSheet<Schema extends ZodType>({
  isOpen,
  onOpenChange,
  ...panel
}: {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
} & Omit<MasterSheetPanelProps<Schema>, 'onDone' | 'left' | 'onLeft'>) {
  return (
    <BottomSheet onOpenChange={onOpenChange} open={isOpen}>
      <BottomSheetContent>
        <MasterSheetPanel {...panel} onDone={() => onOpenChange(false)} />
      </BottomSheetContent>
    </BottomSheet>
  );
}

export function MasterSheetPanel<Schema extends ZodType>({
  onDone,
  left = 'close',
  onLeft,
  title,
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
}: MasterSheetPanelProps<Schema>) {
  const [result, action, isSaving] = useFormAction(upsertAction);
  const [form, fields] = useForm({
    lastResult: result?.submission,
    onValidate: ({ formData }) =>
      parseWithZod(formData, { schema: upsertSchema })
  });
  useCloseOnSuccess(result, (isOpen) => {
    if (!isOpen) {
      onDone();
    }
  });

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
      onDone();
      onDeleted?.();
    }
  });

  return (
    <>
      <SheetHeader
        left={left}
        onLeft={onLeft ?? onDone}
        right={
          isEdit && deleteAction !== undefined ? (
            <SheetTrashButton
              disabled={remove.isPending}
              label={`この${entity}を削除`}
              onClick={() => remove.ask({ id: editing.id, name: editing.name })}
            />
          ) : undefined
        }
        title={title ?? dialogTitle(entity, isEdit)}
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
          disabled={!canSave}
          isPending={isSaving}
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
    </>
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
