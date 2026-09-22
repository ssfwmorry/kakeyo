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
import { deletePlanTypeAction, upsertPlanTypeAction } from '../actions';
import { planReminderLabels } from '../labels';
import { planTypeUpsertSchema } from '../schemas';
import type { PlanTypeCard } from '../types';

// 予定カテゴリ（plan_type）の追加・編集ダイアログ（1 フォーム = 1 スキーマ = 1 useForm）。
// isPair は hidden で送る（設定タブの現在モード由来。service の scope 検証で担保）。

type PlanTypeDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  colors: ColorClassification[];
  isPair: boolean;
  // 編集対象。未指定なら新規作成。
  editing?: PlanTypeCard;
};

export function PlanTypeDialog({
  open,
  onOpenChange,
  colors,
  isPair,
  editing
}: PlanTypeDialogProps) {
  const [result, action] = useFormAction(upsertPlanTypeAction);
  const [deleteResult, deleteAction] = useFormAction(deletePlanTypeAction);
  const [form, fields] = useForm({
    // 編集時は現在値をプリフィルする。defaultValue はマウント時に一度だけ取り込まれる
    // ため、呼び出し元は編集対象ごとに key を変えて本コンポーネントをリマウントすること。
    defaultValue: { name: editing?.name },
    lastResult: result?.submission,
    onValidate: ({ formData }) =>
      parseWithZod(formData, { schema: planTypeUpsertSchema })
  });

  useCloseOnSuccess(result, onOpenChange);
  useCloseOnSuccess(deleteResult, onOpenChange);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{planReminderLabels.entity.planTypeName}</DialogTitle>
        </DialogHeader>
        <form
          {...getFormProps(form)}
          action={action}
          className='flex flex-col gap-4'
        >
          {editing ? (
            <input type='hidden' name='id' value={editing.id} readOnly />
          ) : null}
          <input type='hidden' name='isPair' value={String(isPair)} readOnly />
          <FormField
            label={planReminderLabels.entity.planTypeName}
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
