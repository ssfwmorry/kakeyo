'use client';

import { getFormProps, useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod/v4';
import { useCloseOnSuccess } from '@/components/form/use-close-on-success';
import { useFormAction } from '@/components/form/use-form-action';
import type { SubTypeCard } from '@/features/type-method';
import {
  deleteSubTypeAction,
  upsertSubTypeAction
} from '@/features/type-method/actions';
import { subTypeUpsertSchema } from '@/features/type-method/schemas';
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetTitle
} from '@/v2/components/ui/bottom-sheet';
import { TextField } from '@/v2/components/ui/text-field';
import { SheetActionBar } from './sheet-action-bar';
import { SheetDeleteButton } from './sheet-delete-button';

// サブカテゴリの編集シート。名前だけを持ち、色はカテゴリ側に従う。

export function SubTypeSheet({
  isOpen,
  onOpenChange,
  typeId,
  subType
}: {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  typeId: number;
  subType: SubTypeCard;
}) {
  const [result, action] = useFormAction(upsertSubTypeAction);
  const [form, fields] = useForm({
    lastResult: result?.submission,
    onValidate: ({ formData }) =>
      parseWithZod(formData, { schema: subTypeUpsertSchema })
  });
  useCloseOnSuccess(result, onOpenChange);

  return (
    <BottomSheet onOpenChange={onOpenChange} open={isOpen}>
      <BottomSheetContent>
        <form
          {...getFormProps(form)}
          action={action}
          className='flex flex-col gap-3.5'
        >
          <input name='typeId' readOnly type='hidden' value={typeId} />
          <input name='id' readOnly type='hidden' value={subType.id} />

          <SheetActionBar onCancel={() => onOpenChange(false)}>
            <BottomSheetTitle>サブカテゴリを編集</BottomSheetTitle>
          </SheetActionBar>

          <TextField
            defaultValue={subType.name}
            errorId={fields.name.errorId}
            errors={fields.name.errors}
            key={fields.name.key}
            label='名前'
            name={fields.name.name}
          />

          <p className='px-1 text-muted-foreground text-xs leading-relaxed'>
            名前を変えると、これまでの記録にも新しい名前で表示されます
          </p>
        </form>

        <SheetDeleteButton
          action={deleteSubTypeAction}
          confirmMessage='このサブカテゴリを削除します。元に戻せません。'
          id={subType.id}
          label='このサブカテゴリを削除'
          onDeleted={() => onOpenChange(false)}
        />
      </BottomSheetContent>
    </BottomSheet>
  );
}
