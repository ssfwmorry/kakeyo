'use client';

import { cn } from 'cn';
import { useMemo, useState, useTransition } from 'react';
import {
  IconChevronLeft,
  IconChevronRight,
  IconLock,
  IconShare,
  IconUpdate
} from '@/components/icons';
import { ScreenHeader } from '@/components/screen-header';
import { SectionListEmpty } from '@/components/section-list';
import { colorVar } from '@/features/master';
import type { SummarizedRecordItem } from '@/features/record';
import { useNoteModal } from '@/features/record/components/note-modal';
import { toRecordDefault } from '@/features/record/domain/record-default';
import { fetchSummarizedRecordsAction } from '@/features/summary/actions';
import { monthLabel, shiftMonth } from '@/features/summary/domain/period';
import {
  amountToneClass,
  formatMonthDayWeekJa,
  formatPrice
} from '@/lib/shared/domain/format';
import {
  groupRecordsByDay,
  isLockedRecord,
  type RecordsDayGroup
} from '../domain/records-group';
import {
  axisTag,
  type RecordsTarget,
  recordsTitle,
  scopeTag
} from '../domain/records-heading';
import { summaryLabels } from '../labels';

// 集計 › 明細（原典 SumRecords）。内訳の行から開き、その絞り込みのまま月を動かせる。
// 記録をタップすると入力フローの編集モーダルが開く。
//
// 相手が立て替えた記録は自分の家計には効くので一覧には出すが、編集できるのは
// 立て替えた本人だけ（定期の記録一覧と同じ扱い）。

export function RecordsScreen({
  target,
  initialYearMonth,
  initialRecords,
  colorName
}: {
  // 内訳から引き継いだ絞り込み（見出し・タグ・再取得のキー）。
  target: RecordsTarget & { id: number; subTypeId: number | null };
  initialYearMonth: string;
  initialRecords: SummarizedRecordItem[];
  // 見出しの丸の色。
  colorName: string;
}) {
  const [yearMonth, setYearMonth] = useState(initialYearMonth);
  const [records, setRecords] = useState(initialRecords);
  const [isPending, startTransition] = useTransition();
  const noteModal = useNoteModal();

  const reload = (nextYearMonth: string) => {
    setYearMonth(nextYearMonth);
    startTransition(async () => {
      setRecords(
        await fetchSummarizedRecordsAction({
          isType: target.isType,
          isPay: target.isPay,
          isPair: target.isPair,
          isIncludeInstead: target.isIncludeInstead,
          yearMonth: nextYearMonth,
          id: target.id,
          subTypeId: target.subTypeId
        })
      );
    });
  };

  // 編集で金額や日付が変わるとこの一覧が古くなるので、保存後に取り直す。
  const openEdit = (record: SummarizedRecordItem) => {
    const editing = toRecordDefault(record);
    if (editing === null) {
      return;
    }
    noteModal.open({ editing, onSaved: () => reload(yearMonth) });
  };

  const grouped = useMemo(() => groupRecordsByDay(records), [records]);

  return (
    <div className='flex flex-col'>
      <ScreenHeader backHref='/summary' backLabel='集計' />

      <div className='flex flex-col gap-3 px-4 pb-12'>
        <div className='flex items-center gap-2.5'>
          <span
            aria-hidden='true'
            className='size-3 shrink-0 rounded-full'
            style={{ backgroundColor: colorVar(colorName) }}
          />
          <h1 className='whitespace-nowrap font-bold text-[28px]'>
            {recordsTitle(target)}
          </h1>
        </div>

        <div className='-mt-1 flex flex-wrap gap-1.5'>
          <HeadingTag>{axisTag(target)}</HeadingTag>
          <HeadingTag>{scopeTag(target)}</HeadingTag>
        </div>

        <div className='flex items-center gap-1'>
          <MonthNavButton
            direction='prev'
            isPending={isPending}
            onClick={() => reload(shiftMonth(yearMonth, -1))}
          />
          <span className='font-semibold text-base'>
            {monthLabel(yearMonth)}
          </span>
          <MonthNavButton
            direction='next'
            isPending={isPending}
            onClick={() => reload(shiftMonth(yearMonth, 1))}
          />
          <span className='ml-auto flex items-baseline gap-1'>
            <span className='text-muted-foreground text-xs'>合計</span>
            <span className='font-bold text-[17px]'>
              {grouped.total.toLocaleString('ja-JP')}
            </span>
            <span className='text-muted-foreground text-xs'>円</span>
          </span>
        </div>

        <div
          aria-busy={isPending}
          className={cn('flex flex-col gap-3', isPending && 'opacity-60')}
        >
          {grouped.days.length === 0 ? (
            <div className='overflow-hidden rounded-2xl bg-card'>
              <SectionListEmpty>{summaryLabels.empty.noData}</SectionListEmpty>
            </div>
          ) : (
            grouped.days.map((day) => (
              <DayGroup
                day={day}
                isPay={target.isPay}
                key={day.date}
                onEdit={openEdit}
              />
            ))
          )}
        </div>

        <span className='px-1 text-muted-foreground text-xs leading-relaxed'>
          {summaryLabels.note.records}
        </span>
      </div>
    </div>
  );
}

function HeadingTag({ children }: { children: string }) {
  return (
    <span className='inline-flex h-6 items-center rounded-xl bg-muted px-2.5 font-semibold text-muted-foreground text-xs'>
      {children}
    </span>
  );
}

function MonthNavButton({
  direction,
  isPending,
  onClick
}: {
  direction: 'prev' | 'next';
  isPending: boolean;
  onClick: () => void;
}) {
  const Icon = direction === 'prev' ? IconChevronLeft : IconChevronRight;
  return (
    <button
      aria-label={direction === 'prev' ? '前の月' : '次の月'}
      className='flex size-9 items-center justify-center rounded-full text-foreground disabled:opacity-50'
      disabled={isPending}
      onClick={onClick}
      type='button'
    >
      <Icon aria-hidden='true' className='size-4.5' strokeWidth={2.4} />
    </button>
  );
}

function DayGroup({
  day,
  isPay,
  onEdit
}: {
  day: RecordsDayGroup;
  isPay: boolean;
  onEdit: (record: SummarizedRecordItem) => void;
}) {
  return (
    <div className='flex flex-col gap-1.5'>
      <div className='flex items-baseline px-1'>
        <h2 className='font-semibold text-muted-foreground text-[13px]'>
          {formatMonthDayWeekJa(day.date)}
        </h2>
        <span className={cn('ml-auto text-xs', amountToneClass(isPay))}>
          {formatPrice(day.sum)}
        </span>
      </div>
      <div className='overflow-hidden rounded-2xl bg-card'>
        {day.items.map((record, index) => (
          <RecordRow
            isFirst={index === 0}
            isPay={isPay}
            key={record.id}
            onEdit={onEdit}
            record={record}
          />
        ))}
      </div>
    </div>
  );
}

function RecordRow({
  record,
  isFirst,
  isPay,
  onEdit
}: {
  record: SummarizedRecordItem;
  isFirst: boolean;
  isPay: boolean;
  onEdit: (record: SummarizedRecordItem) => void;
}) {
  const isLocked = isLockedRecord(record);
  const color = colorVar(record.typeColorClassificationName);
  // 2 行目（メモ · 方法）。メモが無ければ方法だけ。
  const sub = [record.memo, record.methodName].filter(Boolean).join(' · ');
  const amount = formatPrice(record.price);
  const title = record.subTypeName ?? record.typeName ?? '';

  const body = (
    <>
      {/* カテゴリのアイコンは DB に無いので、淡色タイル + 色ドットで代用する（D15）。 */}
      <span
        aria-hidden='true'
        className='flex size-9 shrink-0 items-center justify-center rounded-[10px]'
        style={{
          backgroundColor: `color-mix(in srgb, ${color} 20%, var(--card))`
        }}
      >
        <span
          className='size-3 rounded-full'
          style={{ backgroundColor: color }}
        />
      </span>
      <span
        className={cn(
          'flex min-w-0 flex-grow flex-col justify-center gap-0.5 self-stretch',
          !isFirst && 'border-border border-t'
        )}
      >
        <span className='flex items-center gap-1.5 text-[15px]'>
          {title}
          {record.plannedRecordId === null ? null : (
            <IconUpdate
              aria-label='定期の記録'
              className='size-3.5 shrink-0 text-muted-foreground'
              role='img'
              strokeWidth={2.2}
            />
          )}
          {record.isPair && !isLocked ? (
            <IconShare
              aria-label='共有'
              className='size-3.5 shrink-0 text-primary'
              role='img'
              strokeWidth={2.2}
            />
          ) : null}
          {isLocked ? (
            <span className='flex h-[18px] shrink-0 items-center rounded-md bg-muted px-1.5 font-bold text-[11px] text-muted-foreground'>
              {record.pairUserName}の立替
            </span>
          ) : null}
        </span>
        <span className='flex items-center gap-1 truncate text-muted-foreground text-xs'>
          {isLocked ? (
            <IconLock
              aria-label='パートナーのみ編集できます'
              className='size-3 shrink-0'
              role='img'
              strokeWidth={2.4}
            />
          ) : null}
          {sub}
        </span>
      </span>
      <span className={cn('font-semibold text-base', amountToneClass(isPay))}>
        {amount}
      </span>
    </>
  );

  // 相手の立替は押せない。行に出ているバッジと南京錠がその理由を伝えるので、
  // 読み上げ用の名前を別に足さない（押せない要素を読み上げ対象にしても操作できない）。
  if (isLocked) {
    return (
      <div className='flex h-[60px] items-center gap-3 px-3.5'>{body}</div>
    );
  }

  return (
    <button
      aria-label={`${title} ${isPay ? '支出' : '収入'} ${amount} を編集`}
      className='flex h-[60px] w-full items-center gap-3 px-3.5 text-left'
      onClick={() => onEdit(record)}
      type='button'
    >
      {body}
    </button>
  );
}
