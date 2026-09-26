'use client';

import Link from 'next/link';
import { useTransition } from 'react';
import { IconCheck, IconChevronRight } from '@/components/icons';
import { InitialCircle } from '@/components/initial-circle';
import { SheetHeader } from '@/components/sheet-header';
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetTitle
} from '@/components/ui/bottom-sheet';
import { AutoLinkText } from '@/features/plan-reminder';
import { formatSlashDateWeekJa } from '@/lib/shared/domain/format';
import { showToast } from '@/lib/shared/toast/show-toast';
import { checkReminderAction } from '../actions';
import type { NotifyRow } from '../domain/notify-rows';

// お知らせシート（原典 Notify / NotifyAfter / NotifyEmpty）。
// 期日を過ぎたリマインダーを並べ、「確認」で次の日付へ進める。
//
// 行の消し込みは呼び出し側（ベル）が持つ。バッジの件数とシートの一覧が
// 同じ元データから出るようにするため。

const REMINDER_SETTING_PATH = '/setting/reminder';

export function NotifySheet({
  isOpen,
  onOpenChange,
  rows,
  onChecked
}: {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  rows: NotifyRow[];
  // 「確認」が成功したとき。
  onChecked: (id: number) => void;
}) {
  return (
    <BottomSheet onOpenChange={onOpenChange} open={isOpen}>
      <BottomSheetContent aria-label='お知らせ'>
        <SheetHeader
          left='close'
          onLeft={() => onOpenChange(false)}
          title={
            <>
              <BottomSheetTitle>お知らせ</BottomSheetTitle>
              {rows.length > 0 ? <CountBadge count={rows.length} /> : null}
            </>
          }
        />

        <p className='shrink-0 px-1 text-[13px] text-muted-foreground leading-relaxed'>
          期日を過ぎたリマインダーです。済んだら「確認」を押すと、次の日付に進みます。
        </p>

        <div className='shrink-0 overflow-hidden rounded-[14px] bg-card'>
          {rows.map((row, index) => (
            <NotifyRowItem
              isFirst={index === 0}
              key={row.id}
              onChecked={() => onChecked(row.id)}
              row={row}
            />
          ))}
          {rows.length === 0 ? <EmptyState /> : null}
        </div>

        <Link
          className='flex h-11 shrink-0 items-center justify-center gap-1 font-semibold text-[14px] text-primary'
          href={REMINDER_SETTING_PATH}
          onClick={() => onOpenChange(false)}
        >
          リマインダーの設定を開く
          <IconChevronRight
            aria-hidden='true'
            className='size-3.5'
            strokeWidth={2.4}
          />
        </Link>
      </BottomSheetContent>
    </BottomSheet>
  );
}

// タイトル横の件数。
function CountBadge({ count }: { count: number }) {
  return (
    <span className='flex h-5 min-w-5 shrink-0 items-center justify-center rounded-[10px] bg-destructive px-1.5 font-bold text-[12px] text-white'>
      {count}
    </span>
  );
}

function EmptyState() {
  return (
    <div className='flex h-24 flex-col items-center justify-center gap-1.5 text-muted-foreground'>
      <IconCheck aria-hidden='true' className='size-6' strokeWidth={2} />
      <span className='text-sm'>期日を過ぎたリマインダーはありません</span>
    </div>
  );
}

function NotifyRowItem({
  row,
  isFirst,
  onChecked
}: {
  row: NotifyRow;
  isFirst: boolean;
  onChecked: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  const check = () => {
    startTransition(async () => {
      const result = await checkReminderAction(row.id);
      if (result.toast) {
        showToast(result.toast);
      }
      if (result.toast?.type === 'success') {
        onChecked();
      }
    });
  };

  return (
    <div
      className={`flex flex-col gap-2 px-3.5 py-3 ${isFirst ? '' : 'border-t'}`}
    >
      <div className='flex items-center gap-2.5'>
        <InitialCircle colorName={row.colorName} name={row.name} size={32} />
        <span className='flex min-w-0 flex-grow flex-col gap-0.5'>
          <span className='truncate font-semibold text-base'>{row.name}</span>
          <span className='font-semibold text-[12px] text-destructive'>
            {formatSlashDateWeekJa(row.date)} が期日 · {row.overdueDays}
            日過ぎています
          </span>
        </span>
        <button
          aria-label={`${row.name}を確認して次の日付に進める`}
          className='flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-primary py-0 pr-3.5 pl-2.5 font-bold text-[14px] text-primary-foreground disabled:opacity-50'
          disabled={isPending}
          onClick={check}
          type='button'
        >
          <IconCheck aria-hidden='true' className='size-4' strokeWidth={2.8} />
          確認
        </button>
      </div>
      {row.memo !== null && row.memo !== '' ? (
        <span className='whitespace-pre-wrap pl-[42px] text-[13px] text-foreground leading-normal [&_a]:text-primary'>
          <AutoLinkText text={row.memo} />
        </span>
      ) : null}
      <span className='pl-[42px] text-muted-foreground text-xs leading-normal'>
        <NextNote row={row} />
      </span>
    </div>
  );
}

// 「確認すると 10/20（火） に次のお知らせ。この日の予定はカレンダーに残ります」。
function NextNote({ row }: { row: NotifyRow }) {
  if (row.nextDate === null) {
    return null;
  }
  return (
    <>
      確認すると {formatSlashDateWeekJa(row.nextDate)} に次のお知らせ
      {row.keepsPlan ? '。この日の予定はカレンダーに残ります' : ''}
    </>
  );
}
