'use client';

import { cn } from 'cn';
import { IconBell, IconChevronRight } from '@/components/icons';
import type { DaySum } from '@/features/calendar';
import { resolveDisplayIsPay } from '@/features/calendar/domain/record-sign';
import { colorVar } from '@/features/master';
import { useOpenNotifySheet } from '@/features/notify/components/notify-sheet-state';
import type { PlanItem, ReminderItem } from '@/features/plan-reminder';
import {
  isPartnerInstead,
  type NoteRecordDefault,
  PlannedRecordMark,
  RecordAmount,
  type RecordListItem,
  RecordTile
} from '@/features/record';
import { toRecordDefault } from '@/features/record/domain/record-default';

// 選んだ日の予定・リマインダー・記録を 1 枚のカードに積む（原典 Calendar の日別カード）。
//
// 3 種が同じカードに同居し、左端の印だけで種類を見分ける
// （予定 = 色の縦棒、リマインダー = ベル、記録 = 色タイル）。
// 区切り線は左端の印の右から始まる（予定・リマインダーは 14、記録は 62）。

export function DayDetailList({
  daySum,
  plans,
  reminders,
  isLoading = false,
  onEditPlan,
  onEditRecord
}: {
  daySum: DaySum | undefined;
  plans: PlanItem[];
  reminders: ReminderItem[];
  // その日のデータがまだ届いていない（月送りの直後など）。
  isLoading?: boolean;
  onEditPlan: (plan: PlanItem) => void;
  onEditRecord: (record: NoteRecordDefault) => void;
}) {
  const records = daySum?.records ?? [];
  const isEmpty =
    plans.length === 0 && reminders.length === 0 && records.length === 0;

  if (isEmpty) {
    // 届いていないだけの状態で「ありません」と言い切らない。場所だけ空けて待つ。
    return isLoading ? null : (
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

// 行のメモ。全文を折り返して出す（改行も保つ）。長い URL は語中でも折る。
function RowMemo({ memo }: { memo: string }) {
  return (
    <span className='whitespace-pre-wrap break-words text-muted-foreground text-xs leading-relaxed'>
      {memo}
    </span>
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
//
// メモは行の 2 段目に全文を出す。シートを開かないと読めないと、日を眺めるだけで毎回開くことになる。
// メモの分だけ行が伸びるので高さは固定せず、名前と「予定」は上端に揃える
// （縦中央だと、長いメモの横で宙に浮いて見える）。名前は行の見出しなので 1 行で留める。
function PlanRow({
  plan,
  isLast,
  onEdit
}: {
  plan: PlanItem;
  isLast: boolean;
  onEdit: () => void;
}) {
  const memo = plan.memo === null || plan.memo === '' ? null : plan.memo;
  return (
    <>
      <button
        className={cn(
          'flex w-full items-start gap-3 px-3.5 text-left text-foreground',
          memo === null ? 'h-12 items-center' : 'py-3'
        )}
        onClick={onEdit}
        type='button'
      >
        <span
          aria-hidden='true'
          className={cn(
            'w-1 shrink-0 rounded-sm',
            memo === null ? 'h-6' : 'mt-0.5 h-5'
          )}
          style={{
            backgroundColor: colorVar(
              plan.planTypeColorName ?? plan.reminderColorName
            )
          }}
        />
        <span className='flex min-w-0 flex-grow flex-col gap-0.5'>
          <span className='truncate text-[15px]'>{plan.name}</span>
          {memo === null ? null : <RowMemo memo={memo} />}
        </span>
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
  const memo =
    reminder.memo === null || reminder.memo === '' ? null : reminder.memo;
  const body = (
    <>
      <IconBell
        aria-hidden='true'
        className={cn('size-4 shrink-0', memo === null ? null : 'mt-0.5')}
        strokeWidth={2}
        style={{ color: colorVar(reminder.colorName) }}
      />
      <span className='flex min-w-0 flex-grow flex-col gap-0.5'>
        <span className='truncate text-[15px]'>{reminder.name}</span>
        {memo === null ? null : <RowMemo memo={memo} />}
      </span>
      <span className='shrink-0 text-muted-foreground text-xs'>
        リマインダー
      </span>
      <Chevron />
    </>
  );
  const rowClass = cn(
    'flex w-full items-start gap-3 px-3.5 text-left text-foreground',
    memo === null ? 'h-12 items-center' : 'py-3'
  );

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

// 押すと編集シートが開く。精算の記録と相手の立替は押せず、相手の立替はタイルの鍵が理由を伝える。
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
  const rowClass =
    'flex h-15 w-full items-center gap-3 px-3.5 text-left text-foreground';
  const body = (
    <>
      <RecordTile
        colorName={record.typeColorClassificationName}
        isLocked={isPartnerInstead(record)}
        isPair={record.isPair}
      />
      <span className='flex min-w-0 flex-grow flex-col gap-0.5'>
        <span className='flex items-center gap-1.5 text-[15px]'>
          <span className='truncate'>{title}</span>
          <PlannedRecordMark
            isPlannedRecord={record.plannedRecordId !== null}
          />
        </span>
        {record.memo === null ? null : (
          <span className='truncate text-muted-foreground text-xs'>
            {record.memo}
          </span>
        )}
      </span>
      {/* 支出・収入の判定は集計と同じ関数に揃える（精算や isPay=null は自分が送金側かで決まる）。 */}
      <RecordAmount isPay={resolveDisplayIsPay(record)} record={record} />
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
