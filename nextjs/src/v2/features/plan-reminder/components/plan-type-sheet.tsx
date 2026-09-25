'use client';

import { getFormProps, useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod/v4';
import { useCloseOnSuccess } from '@/components/form/use-close-on-success';
import { useFormAction } from '@/components/form/use-form-action';
import type { ColorClassification } from '@/features/master';
import type { PlanTypeCard } from '@/features/plan-reminder';
import {
  deletePlanTypeAction,
  upsertPlanTypeAction
} from '@/features/plan-reminder/actions';
import { planTypeUpsertSchema } from '@/features/plan-reminder/schemas';
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetTitle
} from '@/v2/components/ui/bottom-sheet';
import { ColorGrid } from '@/v2/components/ui/color-grid';
import { TextField } from '@/v2/components/ui/text-field';
import { SheetActionBar } from '@/v2/features/type-method/components/sheet-action-bar';
import { SheetDeleteButton } from '@/v2/features/type-method/components/sheet-delete-button';

// 予定カテゴリの追加・編集シート。名前と色だけを持つ点は方法と同じで、
// 収支の区分（payMode）を持たないところだけが違う。

export function PlanTypeSheet({
  isOpen,
  onOpenChange,
  planType,
  colors,
  isPair
}: {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  // 編集対象。追加のときは undefined。
  planType?: PlanTypeCard;
  colors: ColorClassification[];
  isPair: boolean;
}) {
  const [result, action] = useFormAction(upsertPlanTypeAction);
  const [form, fields] = useForm({
    lastResult: result?.submission,
    onValidate: ({ formData }) =>
      parseWithZod(formData, { schema: planTypeUpsertSchema })
  });
  useCloseOnSuccess(result, onOpenChange);

  const isEdit = planType !== undefined;

  return (
    <BottomSheet onOpenChange={onOpenChange} open={isOpen}>
      <BottomSheetContent>
        <form
          {...getFormProps(form)}
          action={action}
          className='flex flex-col gap-3.5'
        >
          <input name='isPair' readOnly type='hidden' value={String(isPair)} />
          {isEdit ? (
            <input name='id' readOnly type='hidden' value={planType.id} />
          ) : null}

          <SheetActionBar onCancel={() => onOpenChange(false)}>
            <BottomSheetTitle>
              予定カテゴリを{isEdit ? '編集' : '追加'}
            </BottomSheetTitle>
          </SheetActionBar>

          <TextField
            defaultValue={planType?.name}
            errorId={fields.name.errorId}
            errors={fields.name.errors}
            key={fields.name.key}
            label='名前'
            name={fields.name.name}
            placeholder='例：通院'
          />

          <ColorGrid
            colors={colors}
            defaultColorId={planType?.colorClassificationId}
            errorId={fields.colorId.errorId}
            errors={fields.colorId.errors}
            label='色'
            name={fields.colorId.name}
          />
        </form>

        {isEdit ? (
          <SheetDeleteButton
            action={deletePlanTypeAction}
            confirmMessage='この予定カテゴリを削除します。元に戻せません。'
            id={planType.id}
            label='この予定カテゴリを削除'
            onDeleted={() => onOpenChange(false)}
          />
        ) : null}
      </BottomSheetContent>
    </BottomSheet>
  );
}
