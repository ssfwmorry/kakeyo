'use client';

import { getFormProps, useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod/v4';
import { useCloseOnSuccess } from '@/components/form/use-close-on-success';
import { useFormAction } from '@/components/form/use-form-action';
import type { ColorClassification } from '@/features/master';
import type { MethodCard } from '@/features/type-method';
import {
  deleteMethodAction,
  upsertMethodAction
} from '@/features/type-method/actions';
import { methodUpsertSchema } from '@/features/type-method/schemas';
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetTitle
} from '@/v2/components/ui/bottom-sheet';
import { ColorGrid } from '@/v2/components/ui/color-grid';
import { TextField } from '@/v2/components/ui/text-field';
import type { PayMode } from './pay-mode';
import { SheetActionBar } from './sheet-action-bar';
import { SheetDeleteButton } from './sheet-delete-button';

// 方法の追加・編集シート。旧ダイアログ（kakei-method.tsx 内）を下から出すシートに置き換える。
//
// 追加と編集は同じ形で、編集のときだけ末尾に削除を出す（デザイン基礎 SetMethod）。
// フォームの作りは既存と同じ「1 フォーム = 1 スキーマ = 1 useForm」。
//
// 編集対象が変わっても useForm の defaultValue はマウント時にしか取り込まれないため、
// 呼び出し側は method?.id で key を変えてこのコンポーネントごと作り直す。

export function MethodSheet({
  isOpen,
  onOpenChange,
  method,
  payMode,
  entityName,
  placeholder,
  colors,
  isPair
}: {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  // 編集対象。追加のときは undefined。
  method?: MethodCard;
  payMode: PayMode;
  // 「支払方法」「受取方法」「精算方法」。見出しと削除の文言に使う。
  entityName: string;
  placeholder: string;
  colors: ColorClassification[];
  isPair: boolean;
}) {
  const [result, action] = useFormAction(upsertMethodAction);
  const [form, fields] = useForm({
    lastResult: result?.submission,
    onValidate: ({ formData }) =>
      parseWithZod(formData, { schema: methodUpsertSchema })
  });
  useCloseOnSuccess(result, onOpenChange);

  const isEdit = method !== undefined;

  return (
    <BottomSheet onOpenChange={onOpenChange} open={isOpen}>
      <BottomSheetContent>
        <form
          {...getFormProps(form)}
          action={action}
          className='flex flex-col gap-3.5'
        >
          <input name='payMode' readOnly type='hidden' value={payMode} />
          <input name='isPair' readOnly type='hidden' value={String(isPair)} />
          {isEdit ? (
            <input name='id' readOnly type='hidden' value={method.id} />
          ) : null}

          <SheetActionBar onCancel={() => onOpenChange(false)}>
            <BottomSheetTitle>
              {entityName}を{isEdit ? '編集' : '追加'}
            </BottomSheetTitle>
          </SheetActionBar>

          <TextField
            defaultValue={method?.name}
            errorId={fields.name.errorId}
            errors={fields.name.errors}
            key={fields.name.key}
            label='名前'
            name={fields.name.name}
            placeholder={placeholder}
          />

          <ColorGrid
            colors={colors}
            defaultColorId={method?.colorClassificationId}
            errorId={fields.colorId.errorId}
            errors={fields.colorId.errors}
            label='色'
            name={fields.colorId.name}
          />
        </form>

        {isEdit ? (
          <SheetDeleteButton
            action={deleteMethodAction}
            confirmMessage={`この${entityName}を削除します。元に戻せません。`}
            id={method.id}
            label={`この${entityName}を削除`}
            onDeleted={() => onOpenChange(false)}
          />
        ) : null}
      </BottomSheetContent>
    </BottomSheet>
  );
}
