'use client';

import { getFormProps, useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod/v4';
import { FormField } from '@/components/form/form-field';
import { useCloseOnSuccess } from '@/components/form/use-close-on-success';
import { useFormAction } from '@/components/form/use-form-action';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { L } from '@/lib/shared/labels';
import { deleteSubTypeAction, upsertSubTypeAction } from '../actions';
import { typeMethodLabels } from '../labels';
import { subTypeUpsertSchema } from '../schemas';
import type { SubTypeCard } from '../types';

// サブカテゴリ upsert / delete ダイアログ（名前のみ・色なし）。
// 親 type は typeId を hidden で送る。

type SubTypeDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // 親カテゴリ id。作成/更新とも必須。
  typeId: number;
  // 編集対象。未指定なら新規作成。
  editing?: SubTypeCard;
};

export function SubTypeDialog({
  open,
  onOpenChange,
  typeId,
  editing
}: SubTypeDialogProps) {
  const [result, action] = useFormAction(upsertSubTypeAction);
  const [deleteResult, deleteAction] = useFormAction(deleteSubTypeAction);
  const [form, fields] = useForm({
    // 編集時は現在値をプリフィルする。defaultValue はマウント時に一度だけ取り込まれる
    // ため、呼び出し元は編集対象ごとに key を変えて本コンポーネントをリマウントすること。
    defaultValue: { name: editing?.name },
    lastResult: result?.submission,
    onValidate: ({ formData }) =>
      parseWithZod(formData, { schema: subTypeUpsertSchema })
  });

  useCloseOnSuccess(result, onOpenChange);
  useCloseOnSuccess(deleteResult, onOpenChange);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{typeMethodLabels.entity.subTypeName}</DialogTitle>
        </DialogHeader>
        <form
          {...getFormProps(form)}
          action={action}
          className='flex flex-col gap-4'
        >
          {editing ? (
            <input type='hidden' name='id' value={editing.id} readOnly />
          ) : null}
          <input type='hidden' name='typeId' value={typeId} readOnly />
          <FormField
            label={typeMethodLabels.entity.subTypeName}
            field={fields.name}
            key={editing?.id ?? 'new'}
          />
          <DialogFooter>
            <Button type='submit'>{L.button.save}</Button>
          </DialogFooter>
        </form>
        {editing ? (
          <form action={deleteAction}>
            <input type='hidden' name='id' value={editing.id} readOnly />
            <Button type='submit' variant='destructive' className='w-full'>
              {L.button.delete}
            </Button>
          </form>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
