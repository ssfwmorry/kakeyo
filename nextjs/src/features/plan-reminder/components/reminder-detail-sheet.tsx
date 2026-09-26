'use client';

import { useState, useTransition } from 'react';
import { SheetHeader, SheetTrashButton } from '@/components/sheet-header';
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetTitle
} from '@/components/ui/bottom-sheet';
import { ConfirmAlert } from '@/components/ui/confirm-alert';
import { colorVar } from '@/features/master';
import type { ReminderItem } from '@/features/plan-reminder';
import { AutoLinkText } from '@/features/plan-reminder';
import { deleteReminderAction } from '@/features/plan-reminder/actions';
import { formatMonthDayWeekJa, quoted } from '@/lib/shared/domain/format';
import { showToast } from '@/lib/shared/toast/show-toast';
import { reminderTypeText, ruleText } from '../domain/describe';

// リマインダーの詳細シート（原典 SetReminderDetail）。編集は無く、見るか消すか。
//
// 削除はヘッダー右のゴミ箱 → 中央の確認。トーストはここで直に出す
// （成功するとシートごと閉じて effect まで届かないため）。

export function ReminderDetailSheet({
  reminder,
  today,
  onOpenChange
}: {
  reminder: ReminderItem;
  today: string;
  onOpenChange: (isOpen: boolean) => void;
}) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  const remove = () => {
    setIsConfirming(false);
    startTransition(async () => {
      const formData = new FormData();
      formData.set('id', String(reminder.id));
      const result = await deleteReminderAction(null, formData);
      if (result.toast) {
        showToast(result.toast);
      }
      if (result.toast?.type === 'success') {
        onOpenChange(false);
      }
    });
  };

  return (
    <BottomSheet onOpenChange={onOpenChange} open>
      <BottomSheetContent>
        <SheetHeader
          left='close'
          onLeft={() => onOpenChange(false)}
          right={
            <SheetTrashButton
              disabled={isPending}
              label='このリマインダーを削除'
              onClick={() => setIsConfirming(true)}
            />
          }
          title={
            <>
              <span
                aria-hidden='true'
                className='size-2.5 shrink-0 rounded-full'
                style={{ backgroundColor: colorVar(reminder.colorName) }}
              />
              <BottomSheetTitle className='truncate'>
                {reminder.name}
              </BottomSheetTitle>
            </>
          }
        />

        <div className='overflow-hidden rounded-[14px] bg-card'>
          <DetailRow label='次の日付'>
            <span className='font-semibold'>
              {formatMonthDayWeekJa(reminder.date, { today })}
            </span>
          </DetailRow>
          <DetailRow label='その次'>{ruleText(reminder)}</DetailRow>
          <DetailRow label='チェックしたあと'>
            {reminderTypeText(reminder.reminderType)}
          </DetailRow>
          {reminder.memo === null || reminder.memo === '' ? null : (
            <DetailRow isMultiline label='メモ'>
              <span className='whitespace-pre-wrap break-words leading-normal'>
                <AutoLinkText text={reminder.memo} />
              </span>
            </DetailRow>
          )}
        </div>

        <p className='px-1 text-muted-foreground text-xs leading-relaxed'>
          内容を変えるときは、削除して追加し直してください。
        </p>

        <ConfirmAlert
          description={`${quoted(reminder.name)}のお知らせが来なくなります。予定に残した分は消えません。`}
          onCancel={() => setIsConfirming(false)}
          onConfirm={remove}
          open={isConfirming}
          pending={isPending}
          title='このリマインダーを削除しますか？'
        />
      </BottomSheetContent>
    </BottomSheet>
  );
}

function DetailRow({
  label,
  isMultiline = false,
  children
}: {
  label: string;
  // メモのように複数行になる行は上揃えで余白を持つ。
  isMultiline?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={
        isMultiline
          ? 'flex items-start gap-3 border-line-soft border-t p-3.5'
          : 'flex min-h-12 items-center gap-3 border-line-soft border-t px-3.5 first:border-t-0'
      }
    >
      <span className='w-24 shrink-0 text-[14px] text-muted-foreground'>
        {label}
      </span>
      <span className='min-w-0 text-[15px] text-foreground'>{children}</span>
    </div>
  );
}
