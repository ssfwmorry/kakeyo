'use client';

import { getFormProps, useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod/v4';
import { ColorPicker } from '@/components/form/color-picker';
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
import type { ColorClassification } from '@/features/master';
import { L } from '@/lib/shared/labels';
import { deleteTypeAction, upsertTypeAction } from '../actions';
import { typeMethodLabels } from '../labels';
import { typeUpsertSchema } from '../schemas';
import type { TypeCard } from '../types';

// カテゴリ upsert / delete ダイアログ（1 フォーム = 1 スキーマ = 1 useForm）。
// isPay / isPair は hidden で送る（画面のタブ状態由来。クライアント値は
// service 側の scope 検証で担保される）。

type TypeDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  colors: ColorClassification[];
  isPay: boolean;
  isPair: boolean;
  // 編集対象。未指定なら新規作成。
  editing?: TypeCard;
};

export function TypeDialog({
  open,
  onOpenChange,
  colors,
  isPay,
  isPair,
  editing
}: TypeDialogProps) {
  const [result, action] = useFormAction(upsertTypeAction);
  const [deleteResult, deleteAction] = useFormAction(deleteTypeAction);
  const [form, fields] = useForm({
    // 編集時は現在値をプリフィル（呼び出し元は編集対象ごとに key を変えてリマウントすること）。
    defaultValue: { name: editing?.name },
    lastResult: result?.submission,
    onValidate: ({ formData }) =>
      parseWithZod(formData, { schema: typeUpsertSchema })
  });

  useCloseOnSuccess(result, onOpenChange);
  useCloseOnSuccess(deleteResult, onOpenChange);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{typeMethodLabels.entity.typeName}</DialogTitle>
        </DialogHeader>
        <form
          {...getFormProps(form)}
          action={action}
          className='flex flex-col gap-4'
        >
          {editing ? (
            <input type='hidden' name='id' value={editing.id} readOnly />
          ) : null}
          <input type='hidden' name='isPay' value={String(isPay)} readOnly />
          <input type='hidden' name='isPair' value={String(isPair)} readOnly />
          <FormField
            label={typeMethodLabels.entity.typeName}
            field={fields.name}
            key={editing?.id ?? 'new'}
          />
          <ColorPicker
            name='colorId'
            label={L.button.color}
            colors={colors}
            defaultColorId={editing?.colorClassificationId}
            errors={fields.colorId.errors}
            errorId={fields.colorId.errorId}
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
