'use client';

import { cn } from 'cn';
import { useState } from 'react';
import { AddRow } from '@/components/add-row';
import { InitialCircle } from '@/components/initial-circle';
import { ListCellButton } from '@/components/list-cell';
import { ScreenHeader } from '@/components/screen-header';
import { ScreenLead, ScreenNote, ScreenTitle } from '@/components/screen-title';
import { SectionList, SectionListEmpty } from '@/components/section-list';
import type { ColorClassification } from '@/features/master';
import type { ReminderItem } from '@/features/plan-reminder';
import { formatSlashDateWeekJa } from '@/lib/shared/domain/format';
import { ruleText, sortedReminders } from '../domain/describe';
import { ReminderAddSheet } from './reminder-add-sheet';
import { ReminderDetailSheet } from './reminder-detail-sheet';

// 設定 › リマインダー（原典 SetReminder）。
//
// 「設定されているもの」を知る場所なので、期日を過ぎたものも含めて全件を日付順に
// 並べる（過ぎたものの消化はお知らせ（ベル）側の役割）。行を押すと詳細シート、
// 追加行で追加シート。編集は無い（削除して追加し直す）。

type SheetState =
  | { kind: 'closed' }
  | { kind: 'create'; key: number }
  | { kind: 'detail'; reminder: ReminderItem };

export function ReminderScreen({
  reminders,
  colors,
  isPair,
  today
}: {
  reminders: ReminderItem[];
  colors: ColorClassification[];
  isPair: boolean;
  // 期日超過の判定基準。SSR で確定して渡す（端末の時計に委ねない）。
  today: string;
}) {
  const [sheet, setSheet] = useState<SheetState>({ kind: 'closed' });
  const rows = sortedReminders(reminders);
  const close = () => setSheet({ kind: 'closed' });

  return (
    <div className='flex flex-col'>
      <ScreenHeader backHref='/setting' backLabel='設定' />
      <div className='flex flex-col gap-3 px-3'>
        <ScreenTitle badge={isPair ? 'pair' : 'self'}>リマインダー</ScreenTitle>
        <ScreenLead>
          決まった間隔でくり返すお知らせです。日付の順に並びます
        </ScreenLead>

        <SectionList>
          {rows.length === 0 ? (
            <SectionListEmpty>リマインダーはありません</SectionListEmpty>
          ) : (
            rows.map((reminder, index) => (
              <ReminderRow
                isFirst={index === 0}
                key={reminder.id}
                onOpen={() => setSheet({ kind: 'detail', reminder })}
                reminder={reminder}
                today={today}
              />
            ))
          )}
        </SectionList>

        <AddRow
          label='リマインダーを追加'
          onClick={() =>
            setSheet({
              kind: 'create',
              key: (sheet.kind === 'create' ? sheet.key : 0) + 1
            })
          }
        />

        <ScreenNote>
          期日を過ぎたものは、お知らせ（ベル）から確認して次の日付に進められます。
        </ScreenNote>
      </div>

      {sheet.kind === 'create' ? (
        <ReminderAddSheet
          colors={colors}
          key={sheet.key}
          onOpenChange={(isOpen) => !isOpen && close()}
          today={today}
        />
      ) : null}
      {sheet.kind === 'detail' ? (
        <ReminderDetailSheet
          key={sheet.reminder.id}
          onOpenChange={(isOpen) => !isOpen && close()}
          reminder={sheet.reminder}
          today={today}
        />
      ) : null}
    </div>
  );
}

function ReminderRow({
  reminder,
  today,
  isFirst,
  onOpen
}: {
  reminder: ReminderItem;
  today: string;
  isFirst: boolean;
  onOpen: () => void;
}) {
  const date = formatSlashDateWeekJa(reminder.date, { today });
  const isOverdue = reminder.date < today;
  return (
    <ListCellButton
      aria-label={`${reminder.name}（${date}${isOverdue ? '・期日超過' : ''}）の詳細`}
      description={ruleText(reminder.rule)}
      height={64}
      isFirst={isFirst}
      label={reminder.name}
      leading={
        <InitialCircle colorName={reminder.colorName} name={reminder.name} />
      }
      onClick={onOpen}
      value={
        <span
          className={cn(
            'font-semibold text-sm',
            isOverdue ? 'text-destructive' : 'text-foreground'
          )}
        >
          {date}
        </span>
      }
    />
  );
}
