import Link from 'next/link';
import type { DaySum } from '@/features/calendar';
import { resolveDisplayIsPay } from '@/features/calendar/domain/record-sign';
import { colorVar } from '@/features/master';
import type { PlanItem, ReminderItem } from '@/features/plan-reminder';
import type { RecordListItem } from '@/features/record';

// 選んだ日の予定・リマインダー・記録を 1 枚のカードに積む。
//
// デザインでは 3 種が同じカードに同居し、左端の印だけで種類を見分ける
// （予定 = 色の縦棒、リマインダー = ベル、記録 = 色タイル）。

export function DayDetailList({
  daySum,
  plans,
  reminders,
  onEditPlan
}: {
  daySum: DaySum | undefined;
  plans: PlanItem[];
  reminders: ReminderItem[];
  onEditPlan: (plan: PlanItem) => void;
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

  return (
    <div className='overflow-hidden rounded-2xl bg-card'>
      {/* 3 種を続けて積むので、区切り線の有無はカード全体での通し番号で決める。 */}
      {plans.map((plan, index) => (
        <PlanRow
          isFirst={index === 0}
          key={plan.id}
          onEdit={() => onEditPlan(plan)}
          plan={plan}
        />
      ))}
      {reminders.map((reminder, index) => (
        <ReminderRow
          isFirst={plans.length + index === 0}
          key={reminder.id}
          reminder={reminder}
        />
      ))}
      {records.map((record, index) => (
        <RecordRow
          isFirst={plans.length + reminders.length + index === 0}
          key={record.id}
          record={record}
        />
      ))}
    </div>
  );
}

// 押すと編集シートが開く。リマインダー由来の予定（reminderId あり）も同じシートで
// 直せる（元のリマインダーには影響しない）。
function PlanRow({
  plan,
  isFirst,
  onEdit
}: {
  plan: PlanItem;
  isFirst: boolean;
  onEdit: () => void;
}) {
  return (
    <button
      className={`flex h-12 w-full items-center gap-3 px-3.5 text-left text-foreground ${isFirst ? '' : 'border-t'}`}
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
    </button>
  );
}

function ReminderRow({
  reminder,
  isFirst
}: {
  reminder: ReminderItem;
  isFirst: boolean;
}) {
  return (
    <div
      className={`flex h-12 items-center gap-3 px-3.5 ${isFirst ? '' : 'border-t'}`}
    >
      <svg
        aria-hidden='true'
        className='size-4 shrink-0'
        fill='none'
        stroke={colorVar(reminder.colorName)}
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth='2'
        viewBox='0 0 24 24'
      >
        <path d='M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9' />
        <path d='M10.3 21a1.94 1.94 0 0 0 3.4 0' />
      </svg>
      <span className='flex-grow truncate text-[15px]'>{reminder.name}</span>
      <span className='shrink-0 text-muted-foreground text-xs'>
        リマインダー
      </span>
    </div>
  );
}

function RecordRow({
  record,
  isFirst
}: {
  record: RecordListItem;
  isFirst: boolean;
}) {
  const title =
    record.subTypeName === null
      ? (record.typeName ?? '')
      : `${record.typeName} · ${record.subTypeName}`;
  const description =
    record.memo === null
      ? record.methodName
      : `${record.memo} · ${record.methodName}`;
  const color = colorVar(record.typeColorClassificationName);

  return (
    <Link
      className={`flex h-15 items-center gap-3 px-3.5 text-foreground ${isFirst ? '' : 'border-t'}`}
      href={`/v2/note?RECORD=${record.id}`}
    >
      {/* カテゴリ色の淡いタイル。色そのままだと記録が並んだとき強すぎる。 */}
      <span
        aria-hidden='true'
        className='size-9 shrink-0 rounded-[10px]'
        style={{
          backgroundColor: `color-mix(in oklch, ${color} 20%, var(--card))`
        }}
      />
      <span className='flex min-w-0 flex-grow flex-col gap-0.5'>
        <span className='truncate text-[15px]'>{title}</span>
        <span className='truncate text-muted-foreground text-xs'>
          {description}
        </span>
      </span>
      {/* 符号は集計と同じ判定に揃える（精算や isPay=null は自分が送金側かで決まる）。 */}
      <span className='shrink-0 font-semibold text-base tabular-nums'>
        {resolveDisplayIsPay(record) ? '−' : '+'}
        {record.price.toLocaleString('ja-JP')}
      </span>
    </Link>
  );
}
