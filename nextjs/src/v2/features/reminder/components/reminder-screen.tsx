'use client';

import { useState } from 'react';
import type { ColorClassification } from '@/features/master';
import type { ReminderItem } from '@/features/plan-reminder';
import { AddRow } from '@/v2/components/add-row';
import { InitialCircle } from '@/v2/components/initial-circle';
import { ListCellButton } from '@/v2/components/list-cell';
import { ScreenHeader } from '@/v2/components/screen-header';
import {
  ScreenLead,
  ScreenNote,
  ScreenTitle
} from '@/v2/components/screen-title';
import { SectionList, SectionListEmpty } from '@/v2/components/section-list';
import { formatSlashDateWeekJa } from '@/v2/lib/format';
import { ruleText, upcomingReminders } from '../domain/describe';
import { ReminderAddSheet } from './reminder-add-sheet';
import { ReminderDetailSheet } from './reminder-detail-sheet';

// 設定 › リマインダー（原典 SetReminder）。
//
// 一覧はこれから（今日以降）のものだけを近い順に並べる。期日を過ぎたものは
// お知らせ（ベル）で消化するので、ここには出さない。行を押すと詳細シート、
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
  // 「これから」の判定基準。SSR で確定して渡す（端末の時計に委ねない）。
  today: string;
}) {
  const [sheet, setSheet] = useState<SheetState>({ kind: 'closed' });
  const rows = upcomingReminders(reminders, today);
  const close = () => setSheet({ kind: 'closed' });

  return (
    <div className='flex flex-col'>
      <ScreenHeader backHref='/setting' backLabel='設定' />
      <div className='flex flex-col gap-3 px-4'>
        <ScreenTitle badge={isPair ? 'pair' : 'self'}>リマインダー</ScreenTitle>
        <ScreenLead>
          決まった間隔でくり返すお知らせです。近い日付の順に並びます
        </ScreenLead>

        <SectionList>
          {rows.length === 0 ? (
            <SectionListEmpty>
              これからのリマインダーはありません
            </SectionListEmpty>
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
          期日を過ぎたものはここには出ません。お知らせ（ベル）から確認できます。
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
  return (
    <ListCellButton
      aria-label={`${reminder.name}（${date}）の詳細`}
      description={ruleText(reminder)}
      height={64}
      isFirst={isFirst}
      label={reminder.name}
      leading={
        <InitialCircle colorName={reminder.colorName} name={reminder.name} />
      }
      onClick={onOpen}
      value={
        <span className='font-semibold text-foreground text-sm'>{date}</span>
      }
    />
  );
}
