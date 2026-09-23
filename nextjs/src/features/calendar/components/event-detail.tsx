'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { ConfirmDialog } from '@/components/form/confirm-dialog';
import { useFormToast } from '@/components/form/use-form-toast';
import { ShareBadge } from '@/components/share-badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { colorHex } from '@/features/master';
import {
  AutoLinkText,
  deletePlanAction,
  type PlanItem,
  type ReminderItem
} from '@/features/plan-reminder';
import { L } from '@/lib/shared/labels';
import type { FormActionResult } from '@/lib/shared/types/formResult';
import { calendarLabels } from '../labels';

// カレンダー上の予定/リマインダーをクリックしたときに出す詳細カード。
// - 予定（通常）: 「編集」で /plan?planId=<id> へ遷移（編集画面で更新/削除する）。
// - 予定（リマインダー由来 = reminderId あり）: その場で削除ボタンを出す
//   （編集対象は元のリマインダー側なので、ここでは実体化された plan を消すのみ）。
// - リマインダー: 表示のみ（ボタン無し）。
// memo は AutoLinkText で URL を自動リンク化する。

const { plan: PL, reminder: RM } = calendarLabels.eventDetail;

// plan / reminder いずれかの詳細を表示する。両方 null なら何も出さない。
export function EventDetail({
  plan,
  reminder,
  onClose
}: {
  plan: PlanItem | null;
  reminder: ReminderItem | null;
  onClose: () => void;
}) {
  if (plan) {
    return <PlanCard plan={plan} onDeleted={onClose} />;
  }
  if (reminder) {
    return <ReminderCard reminder={reminder} />;
  }
  return null;
}

function PlanCard({
  plan,
  onDeleted
}: {
  plan: PlanItem;
  onDeleted: () => void;
}) {
  // リマインダー由来（reminderId あり）の plan はカテゴリを持たず、編集不可・削除のみ。
  // 通常 plan は planTypeId があるので編集導線を出す。
  const isFromReminder = plan.reminderId !== null;
  const colorName = plan.planTypeColorName ?? plan.reminderColorName ?? 'grey';

  return (
    <Card>
      <CardHeader layout='row'>
        <span className='flex items-center gap-2'>
          <ShareBadge
            colorHex={colorHex(colorName)}
            isPair={plan.isPair}
            shape='square'
            className='size-6'
          />
          <span className='font-medium'>{plan.name}</span>
        </span>
        {plan.planTypeName ? (
          <span className='text-muted-foreground text-xs'>
            {plan.planTypeName}
          </span>
        ) : null}
      </CardHeader>
      <CardContent className='flex flex-col gap-2 text-sm'>
        {plan.memo ? (
          <pre className='whitespace-pre-wrap font-sans'>
            <AutoLinkText text={plan.memo} />
          </pre>
        ) : null}
        <div className='flex justify-end gap-2'>
          {isFromReminder ? (
            <PlanDeleteButton id={plan.id} onDeleted={onDeleted} />
          ) : plan.planTypeId !== null ? (
            <Link
              href={`/plan?planId=${plan.id}`}
              className={buttonVariants({ variant: 'outline', size: 'sm' })}
            >
              {L.button.edit}
            </Link>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

// リマインダー由来 plan の削除。成功時は deletePlanAction が /calendar へ
// redirect するため、その場でカレンダーが再取得される。
function PlanDeleteButton({
  id,
  onDeleted
}: {
  id: number;
  onDeleted: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<FormActionResult | null>(null);
  // 失敗時のみ toast が発火する（成功は redirect で消える）。
  useFormToast(result);

  const handleDelete = () => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set('id', String(id));
      const res = await deletePlanAction(null, formData);
      // redirect が起きなかった＝失敗時のみここに到達する。
      setResult(res);
      onDeleted();
    });
  };

  return (
    <ConfirmDialog
      trigger={
        <Button
          type='button'
          size='sm'
          variant='destructive'
          disabled={isPending}
        >
          {L.button.delete}
        </Button>
      }
      title={PL.deleteConfirm}
      onConfirm={handleDelete}
    />
  );
}

function ReminderCard({ reminder }: { reminder: ReminderItem }) {
  return (
    <Card>
      <CardHeader layout='row'>
        <span className='flex items-center gap-2'>
          <ShareBadge
            colorHex={colorHex(reminder.colorName)}
            isPair={reminder.isPair}
            shape='square'
            className='size-6'
          />
          <span className='font-medium'>{reminder.name}</span>
        </span>
        <span className='text-muted-foreground text-xs'>{RM.badge}</span>
      </CardHeader>
      {reminder.memo ? (
        <CardContent className='text-sm'>
          <pre className='whitespace-pre-wrap font-sans'>
            <AutoLinkText text={reminder.memo} />
          </pre>
        </CardContent>
      ) : null}
    </Card>
  );
}
