'use client';

import { getFormProps, useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod/v4';
import { ColorPicker as BankColorPicker } from '@/components/form/color-picker';
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
import { deleteBankAction, upsertBankAction } from '../actions';
import { bankLabels } from '../labels';
import { bankFormSchema } from '../schemas/bank-schema';
import type { BankItem } from '../types';

// 口座（bank）の追加・編集ダイアログ（1 フォーム = 1 スキーマ = 1 useForm）。
// type-method の TypeDialog を手本にする。名前は FormField、色は BankColorPicker。
// 編集時のみ id を hidden で送り、削除ボタンを別 form（deleteBankAction）で出す。

type BankFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  colors: ColorClassification[];
  // 編集対象。未指定なら新規作成。
  editing?: BankItem;
};

export function BankFormDialog({
  open,
  onOpenChange,
  colors,
  editing
}: BankFormDialogProps) {
  const [result, action] = useFormAction(upsertBankAction);
  const [deleteResult, deleteAction] = useFormAction(deleteBankAction);
  const [form, fields] = useForm({
    // 編集時は現在値をプリフィル（呼び出し元は編集対象ごとに key を変えてリマウントすること）。
    defaultValue: { name: editing?.name },
    lastResult: result?.submission,
    onValidate: ({ formData }) =>
      parseWithZod(formData, { schema: bankFormSchema })
  });

  useCloseOnSuccess(result, onOpenChange);
  useCloseOnSuccess(deleteResult, onOpenChange);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{bankLabels.heading.bankName}</DialogTitle>
        </DialogHeader>
        <form
          {...getFormProps(form)}
          action={action}
          className='flex flex-col gap-4'
        >
          {editing ? (
            <input type='hidden' name='id' value={editing.id} readOnly />
          ) : null}
          <FormField
            label={bankLabels.heading.bankName}
            field={fields.name}
            key={editing?.id ?? 'new'}
          />
          <BankColorPicker
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
