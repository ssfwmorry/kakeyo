'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { ConfirmDialog } from '@/components/form/confirm-dialog';
import { useFormToast } from '@/components/form/use-form-toast';
import { IconPencil, IconTrash } from '@/components/icons';
import { ShareBadge } from '@/components/share-badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { colorHex } from '@/features/master';
import {
  AutoLinkText,
  deletePlanAction,
  type PlanItem,
  type ReminderItem
} from '@/features/plan-reminder';
import { formatDateLabelJst } from '@/lib/shared/domain/date';
import { L } from '@/lib/shared/labels';
import type { FormActionResult } from '@/lib/shared/types/formResult';
import { calendarLabels } from '../labels';

// 選択日の予定・リマインダーを日パネルに並べる。
// グリッドのバーはセル幅で名前が切れるため、日付を選べばここで全文が読める。
// - 予定（通常）: 鉛筆で /plan?planId=<id> へ（編集画面で更新/削除する）。
// - 予定（リマインダー由来 = reminderId あり）: 編集対象は元のリマインダー側なので、
//   ここでは実体化された plan を消すゴミ箱だけを出す。
// - リマインダー: 表示のみ。

export function DayPlanList({
  plans,
  reminders
}: {
  plans: PlanItem[];
  reminders: ReminderItem[];
}) {
  if (plans.length === 0 && reminders.length === 0) {
    return null;
  }
  return (
    <ul className='flex flex-col gap-1'>
      {plans.map((plan) => (
        <PlanRow key={`plan-${plan.id}`} plan={plan} />
      ))}
      {reminders.map((reminder) => (
        <ReminderRow key={`reminder-${reminder.id}`} reminder={reminder} />
      ))}
    </ul>
  );
}

function EventRow({
  colorName,
  isPair,
  name,
  note,
  memo,
  action
}: {
  colorName: string;
  isPair: boolean;
  name: string;
  // 名前の右に添える補足（カテゴリ名・期間・「リマインダー」）。
  note: string | null;
  memo: string | null;
  action?: React.ReactNode;
}) {
  return (
    <li className='flex items-start gap-2 rounded-md border px-2 py-1.5 text-sm'>
      <ShareBadge
        colorHex={colorHex(colorName)}
        isPair={isPair}
        shape='square'
        className='mt-0.5 size-4'
      />
      <div className='flex min-w-0 flex-1 flex-col gap-0.5'>
        <span className='flex items-baseline gap-2'>
          <span className='truncate'>{name}</span>
          {note ? (
            <span className='shrink-0 text-muted-foreground text-xs'>
              {note}
            </span>
          ) : null}
        </span>
        {memo ? (
          <p className='whitespace-pre-wrap text-muted-foreground text-xs'>
            <AutoLinkText text={memo} />
          </p>
        ) : null}
      </div>
      {action}
    </li>
  );
}

// 複数日の予定は期間を補足に出す（単日ならカテゴリ名）。
function planNote(plan: PlanItem): string | null {
  if (plan.startDate !== plan.endDate) {
    return `${formatDateLabelJst(plan.startDate)}〜${formatDateLabelJst(plan.endDate)}`;
  }
  return plan.planTypeName;
}

function PlanRow({ plan }: { plan: PlanItem }) {
  const isFromReminder = plan.reminderId !== null;
  const action = isFromReminder ? (
    <PlanDeleteButton id={plan.id} />
  ) : plan.planTypeId !== null ? (
    <Link
      href={`/plan?planId=${plan.id}`}
      aria-label={`${plan.name} を${L.button.edit}`}
      className={buttonVariants({
        variant: 'ghost',
        size: 'icon-sm',
        className: '-my-1 -mr-1 text-muted-foreground'
      })}
    >
      <IconPencil className='size-4' />
    </Link>
  ) : undefined;

  return (
    <EventRow
      colorName={plan.planTypeColorName ?? plan.reminderColorName ?? 'grey'}
      isPair={plan.isPair}
      name={plan.name}
      note={planNote(plan)}
      memo={plan.memo}
      action={action}
    />
  );
}

function ReminderRow({ reminder }: { reminder: ReminderItem }) {
  return (
    <EventRow
      colorName={reminder.colorName}
      isPair={reminder.isPair}
      name={reminder.name}
      note={calendarLabels.event.reminder}
      memo={reminder.memo}
    />
  );
}

// リマインダー由来 plan の削除。成功時は deletePlanAction が /calendar へ redirect して
// カレンダーが再取得されるので、result に値が入る（= toast が出る）のは失敗時だけ。
function PlanDeleteButton({ id }: { id: number }) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<FormActionResult | null>(null);
  useFormToast(result);

  const handleDelete = () => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set('id', String(id));
      setResult(await deletePlanAction(null, formData));
    });
  };

  return (
    <ConfirmDialog
      trigger={
        <Button
          type='button'
          variant='ghost'
          size='icon-sm'
          className='-my-1 -mr-1 text-muted-foreground'
          disabled={isPending}
          aria-label={L.button.delete}
        >
          <IconTrash className='size-4' />
        </Button>
      }
      title={calendarLabels.event.deleteConfirm}
      onConfirm={handleDelete}
    />
  );
}
