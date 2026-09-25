'use client';

import { cn } from 'cn';
import { IconBell, IconChevronRight } from '@/components/icons';
import type { DaySum } from '@/features/calendar';
import { resolveDisplayIsPay } from '@/features/calendar/domain/record-sign';
import { colorVar } from '@/features/master';
import type { PlanItem, ReminderItem } from '@/features/plan-reminder';
import type { NoteRecordDefault, RecordListItem } from '@/features/record';
import { toRecordDefault } from '@/v2/features/note/domain/record-default';
import { useOpenNotifySheet } from '@/v2/features/notify/components/notify-sheet-state';
import { formatSignedPrice } from '@/v2/lib/format';

// 選んだ日の予定・リマインダー・記録を 1 枚のカードに積む（原典 Calendar の日別カード）。
//
// 3 種が同じカードに同居し、左端の印だけで種類を見分ける
// （予定 = 色の縦棒、リマインダー = ベル、記録 = 色タイル）。
// 区切り線は左端の印の右から始まる（予定・リマインダーは 14、記録は 62）。

export function DayDetailList({
  daySum,
  plans,
  reminders,
  onEditPlan,
  onEditRecord
}: {
  daySum: DaySum | undefined;
  plans: PlanItem[];
  reminders: ReminderItem[];
  onEditPlan: (plan: PlanItem) => void;
  onEditRecord: (record: NoteRecordDefault) => void;
}) {
  const records = daySum?.records ?? [];
  const isEmpty =
    plans.length === 0 && reminders.length === 0 && records.length === 0;

  if (isEmpty) {
    return (
      <p className='px-1 text-muted-foreground text-sm'>
        この日の記録・予定はありません。
      </p>
    );
  }

  const total = plans.length + reminders.length + records.length;

  return (
    <div className='overflow-hidden rounded-2xl bg-card'>
      {/* 3 種を続けて積むので、区切り線の有無はカード全体での通し番号で決める。 */}
      {plans.map((plan, index) => (
        <PlanRow
          isLast={index === total - 1}
          key={plan.id}
          onEdit={() => onEditPlan(plan)}
          plan={plan}
        />
      ))}
      {reminders.map((reminder, index) => (
        <ReminderRow
          isLast={plans.length + index === total - 1}
          key={reminder.id}
          reminder={reminder}
        />
      ))}
      {records.map((record, index) => (
        <RecordRow
          isLast={plans.length + reminders.length + index === total - 1}
          key={record.id}
          onEdit={onEditRecord}
          record={record}
        />
      ))}
    </div>
  );
}

// 行の下の区切り線。inset は左端の印の幅。
function Divider({ inset }: { inset: 14 | 62 }) {
  return (
    <div className={cn('border-t', inset === 14 ? 'ml-3.5' : 'ml-[62px]')} />
  );
}

function Chevron() {
  return (
    <IconChevronRight
      aria-hidden='true'
      className='size-3.5 shrink-0 text-icon-muted'
      strokeWidth={2.4}
    />
  );
}

// 押すと編集シートが開く。リマインダー由来の予定（reminderId あり）も同じシートで
// 直せる（元のリマインダーには影響しない）。
function PlanRow({
  plan,
  isLast,
  onEdit
}: {
  plan: PlanItem;
  isLast: boolean;
  onEdit: () => void;
}) {
  return (
    <>
      <button
        className='flex h-12 w-full items-center gap-3 px-3.5 text-left text-foreground'
        onClick={onEdit}
        type='button'
      >
        <span
          aria-hidden='true'
          className='h-6 w-1 shrink-0 rounded-sm'
          style={{
            backgroundColor: colorVar(
              plan.planTypeColorName ?? plan.reminderColorName
            )
          }}
        />
        <span className='flex-grow truncate text-[15px]'>{plan.name}</span>
        <span className='shrink-0 text-muted-foreground text-xs'>予定</span>
        <Chevron />
      </button>
      {isLast ? null : <Divider inset={14} />}
    </>
  );
}

// 押すとお知らせシートが開く（消化はそこで行う）。
function ReminderRow({
  reminder,
  isLast
}: {
  reminder: ReminderItem;
  isLast: boolean;
}) {
  const openNotify = useOpenNotifySheet();
  const body = (
    <>
      <IconBell
        aria-hidden='true'
        className='size-4 shrink-0'
        strokeWidth={2}
        style={{ color: colorVar(reminder.colorName) }}
      />
      <span className='flex-grow truncate text-[15px]'>{reminder.name}</span>
      <span className='shrink-0 text-muted-foreground text-xs'>
        リマインダー
      </span>
      <Chevron />
    </>
  );
  const rowClass =
    'flex h-12 w-full items-center gap-3 px-3.5 text-left text-foreground';

  return (
    <>
      {openNotify === null ? (
        <div className={rowClass}>{body}</div>
      ) : (
        <button className={rowClass} onClick={openNotify} type='button'>
          {body}
        </button>
      )}
      {isLast ? null : <Divider inset={14} />}
    </>
  );
}

// 押すと編集シートが開く。精算の記録は入力フローの形に載らないので押せない。
function RecordRow({
  record,
  isLast,
  onEdit
}: {
  record: RecordListItem;
  isLast: boolean;
  onEdit: (record: NoteRecordDefault) => void;
}) {
  const editing = toRecordDefault(record);
  const title =
    record.subTypeName === null
      ? (record.typeName ?? '')
      : `${record.typeName} · ${record.subTypeName}`;
  const description =
    record.memo === null
      ? record.methodName
      : `${record.memo} · ${record.methodName}`;
  const color = colorVar(record.typeColorClassificationName);

  const rowClass =
    'flex h-15 w-full items-center gap-3 px-3.5 text-left text-foreground';
  const body = (
    <>
      {/* カテゴリのアイコンは DB に無いので、淡い色タイルに色のドットを置く（README D15）。 */}
      <span
        aria-hidden='true'
        className='flex size-9 shrink-0 items-center justify-center rounded-[10px]'
        style={{
          backgroundColor: `color-mix(in srgb, ${color} var(--band-mix), var(--card))`
        }}
      >
        <span
          className='size-3 rounded-full'
          style={{ backgroundColor: color }}
        />
      </span>
      <span className='flex min-w-0 flex-grow flex-col gap-0.5'>
        <span className='truncate text-[15px]'>{title}</span>
        <span className='truncate text-muted-foreground text-xs'>
          {description}
        </span>
      </span>
      {/* 符号は集計と同じ判定に揃える（精算や isPay=null は自分が送金側かで決まる）。 */}
      <span className='shrink-0 font-semibold text-base'>
        {formatSignedPrice(record.price, resolveDisplayIsPay(record))}
      </span>
    </>
  );

  return (
    <>
      {editing === null ? (
        <div className={rowClass}>{body}</div>
      ) : (
        <button
          className={rowClass}
          onClick={() => onEdit(editing)}
          type='button'
        >
          {body}
        </button>
      )}
      {isLast ? null : <Divider inset={62} />}
    </>
  );
}
