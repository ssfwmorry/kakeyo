'use client';

import { cn } from 'cn';
import { useState, useTransition } from 'react';
import { IconCheck } from '@/components/icons';
import type { ReminderItem } from '@/features/plan-reminder';
import { checkReminderAction } from '@/features/plan-reminder/actions';
import { formatDateWithWeekdayJst } from '@/lib/shared/domain/date';
import { AddRowLink } from '@/v2/components/add-row';
import { ListCellButton } from '@/v2/components/list-cell';
import { ScreenHeader } from '@/v2/components/screen-header';
import { ScreenTitle } from '@/v2/components/screen-title';
import { SectionList } from '@/v2/components/section-list';
import { showToast } from '@/v2/lib/toast';

// リマインダー設定（新デザイン）。
//
// 旧タブはカード 1 枚ずつに条件を全部並べていたが、新デザインでは
// 「期日を過ぎたもの / これから」の 2 グループのリストにして、丸を押すと消化する。
// 消化は次回日付への繰り越し（checkReminder）なので、成功するとその行は
// 「これから」へ移る。楽観的にチェックを点けておき、サーバ確定で並びが入れ替わる。

export function ReminderScreen({
  reminders,
  today
}: {
  reminders: ReminderItem[];
  // 期日超過の判定基準。JST の今日を SSR 側で確定して渡す
  // （クライアントの時計と端末 tz に判定を委ねない）。
  today: string;
}) {
  const overdue = reminders.filter((reminder) => reminder.date <= today);
  const upcoming = reminders.filter((reminder) => reminder.date > today);

  return (
    <div className='flex flex-col'>
      <ScreenHeader backHref='/v2/setting' backLabel='設定' />
      <div className='flex flex-col gap-3 px-4'>
        <ScreenTitle badge='self'>リマインダー</ScreenTitle>

        {overdue.length > 0 ? (
          <SectionList
            title={
              <span className='font-bold text-destructive'>
                期日を過ぎたもの
              </span>
            }
          >
            {overdue.map((reminder, index) => (
              <ReminderRow
                isFirst={index === 0}
                isOverdue
                key={reminder.id}
                reminder={reminder}
              />
            ))}
          </SectionList>
        ) : null}

        {upcoming.length > 0 ? (
          <SectionList title='これから'>
            {upcoming.map((reminder, index) => (
              <ReminderRow
                isFirst={index === 0}
                isOverdue={false}
                key={reminder.id}
                reminder={reminder}
              />
            ))}
          </SectionList>
        ) : null}

        {reminders.length === 0 ? (
          <p className='px-1 text-muted-foreground text-sm'>
            リマインダーはまだありません。
          </p>
        ) : null}

        {/* 追加フォームは条件分岐が多く、v2 の入力部品一式が要る。それが揃うまでは
            旧設定画面へ送る（押せない行を置くより、追加できる場所へ導く）。 */}
        <AddRowLink href='/setting' label='リマインダーを追加' />

        <p className='px-1 text-muted-foreground text-xs leading-relaxed'>
          丸を押すと消化済みになります。期日を過ぎたものはお知らせ（ベル）にも出ます。
        </p>
      </div>
    </div>
  );
}

function ReminderRow({
  reminder,
  isOverdue,
  isFirst
}: {
  reminder: ReminderItem;
  isOverdue: boolean;
  isFirst: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  // 送信中だけチェックを点けて打ち消し線にする。成功すれば再検証で行ごと
  // 「これから」へ移るため、確定後にこの値を持ち続ける必要はない。
  const [isChecking, setIsChecking] = useState(false);

  const check = () => {
    startTransition(async () => {
      setIsChecking(true);
      const result = await checkReminderAction(reminder.id);
      if (result.toast) {
        showToast(result.toast);
      }
      // 失敗時はチェックを戻す（成功時は行が入れ替わるので戻す必要がない）。
      if (result.toast?.type === 'error') {
        setIsChecking(false);
      }
    });
  };

  return (
    <ListCellButton
      aria-label={`${reminder.name}を消化`}
      disabled={isPending}
      height={60}
      isFirst={isFirst}
      label={
        <span
          className={cn(isChecking && 'text-muted-foreground line-through')}
        >
          {reminder.name}
        </span>
      }
      description={
        <span className={cn(isOverdue && !isChecking && 'text-destructive')}>
          {formatDateWithWeekdayJst(reminder.date)}
        </span>
      }
      leading={<CheckCircle isChecked={isChecking} isOverdue={isOverdue} />}
      onClick={check}
      // この行は「押すと消化」で、進む先がない。既定のシェブロンは
      // 詳細画面へ進めると誤解させるので出さない。
      trailing={null}
    />
  );
}

// 消化ボタンの丸。未消化は輪郭だけ（期日超過は赤）、消化中はアクセントで塗ってチェック。
function CheckCircle({
  isChecked,
  isOverdue
}: {
  isChecked: boolean;
  isOverdue: boolean;
}) {
  return (
    <span
      aria-hidden='true'
      className={cn(
        'flex size-6.5 shrink-0 items-center justify-center rounded-full border-2',
        isChecked
          ? 'border-transparent bg-primary'
          : isOverdue
            ? 'border-destructive'
            : 'border-muted-foreground/50'
      )}
    >
      {isChecked ? (
        <IconCheck
          className='size-3.5 text-primary-foreground'
          strokeWidth={3}
        />
      ) : null}
    </span>
  );
}
