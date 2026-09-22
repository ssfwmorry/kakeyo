'use client';

import { useState, useTransition } from 'react';
import { useFormToast } from '@/components/form/use-form-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import type { ColorClassification } from '@/features/master';
import { colorHex } from '@/features/master';
import { L } from '@/lib/shared/labels';
import type { FormActionResult } from '@/lib/shared/types/formResult';
import { deleteReminderAction } from '../actions';
import {
  BaseType,
  ConditionType,
  ReminderType
} from '../domain/reminder-condition';
import { planReminderLabels } from '../labels';
import type { GroupedReminderList, ReminderItem } from '../types';
import { ReminderDialog } from './reminder-dialog';

// 定期的な予定（reminder）設定タブ。作成と削除のみで編集機能は持たない。

const { reminder: R } = planReminderLabels;

type ReminderTabProps = {
  reminderList: GroupedReminderList;
  colors: ColorClassification[];
  isPair: boolean;
};

export function ReminderTab({
  reminderList,
  colors,
  isPair
}: ReminderTabProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const items = isPair ? reminderList.pair : reminderList.self;

  return (
    <section className='flex flex-col gap-3'>
      <h2 className='text-base font-medium'>
        {planReminderLabels.heading.reminder}
      </h2>

      {items.map((reminder) => (
        <ReminderCardView key={reminder.id} reminder={reminder} />
      ))}

      <div className='flex justify-end'>
        <Button type='button' onClick={() => setDialogOpen(true)}>
          ＋
        </Button>
      </div>

      <ReminderDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        colors={colors}
        isPair={isPair}
      />
    </section>
  );
}

type ReminderCardViewProps = {
  reminder: ReminderItem;
};

function ReminderCardView({ reminder }: ReminderCardViewProps) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<FormActionResult | null>(null);
  useFormToast(result);

  const handleDelete = () => {
    if (!window.confirm(R.deleteConfirm)) {
      return;
    }
    startTransition(async () => {
      const formData = new FormData();
      formData.set('id', String(reminder.id));
      setResult(await deleteReminderAction(null, formData));
    });
  };

  return (
    <Card>
      <CardHeader className='flex-row items-center justify-between gap-2'>
        <span className='flex items-center gap-2'>
          <span
            className='inline-block size-5 rounded-full'
            style={{ backgroundColor: colorHex(reminder.colorName) }}
          />
          {reminder.name}
        </span>
        <Button
          type='button'
          size='sm'
          variant='ghost'
          disabled={isPending}
          onClick={handleDelete}
        >
          {L.button.delete}
        </Button>
      </CardHeader>
      <CardContent className='flex flex-col gap-1 text-sm'>
        {reminder.memo ? <span>・{reminder.memo}</span> : null}
        <span>
          ・{planReminderLabels.entity.date}：{reminder.date}
        </span>
        <span>
          ・{R.checkKeep}：
          {reminder.reminderType === ReminderType.stock ? R.keep : R.notKeep}
        </span>
        <span>
          ・{R.nextPlan}：{describeCondition(reminder)}
        </span>
      </CardContent>
    </Card>
  );
}

// 条件の人間可読テキストを組み立てる。
function describeCondition(reminder: ReminderItem): string {
  if (reminder.conditionType === ConditionType.month) {
    const base = reminder.baseType === BaseType.now ? R.baseNow : R.baseDate;
    return `${base}${R.from}${reminder.month ?? ''}${R.months}`;
  }
  // 月日指定は常に来年の MM-DD として表示する。
  return `${R.nextYearPrefix}${reminder.monthDay ?? ''}`;
}
