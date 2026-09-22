'use client';

import { cn } from 'cn';
import { colorHex } from '@/features/master';
import type { RecordListItem } from '@/features/record';
import { formatRecordPrice } from '../domain/format';
import { resolveDisplayIsPay } from '../domain/record-sign';
import { calendarLabels } from '../labels';

// 選択した日の record 一覧（表示のみ）。旧 pages/calendar.vue の RecordCard 相当。
// record ドメインの表示用 Client（NoteRecordForm 等）は編集フォーム用途で、単純な
// 一覧表示 Component は公開されていないため、ここでカレンダー用の軽量カードを持つ。
// 編集導線（記録の個別編集）は /note に record 編集の受け口が無いため今回は TODO。

type DayRecordListProps = {
  dateStr: string | null;
  // その日の record（親が selectedDate に対応する DaySum.records を渡す）。
  records: RecordListItem[];
  holidayName: string | null;
};

// カテゴリ / サブ / 方法 / 相手名を 1 行に連結する（表示専用）。
function recordSummary(record: RecordListItem): string {
  const type = record.typeName ?? '精算';
  const sub = record.subTypeName ? ` / ${record.subTypeName}` : '';
  const method = ` · ${record.methodName}`;
  const pair =
    record.isPair && record.pairUserName ? ` · ${record.pairUserName}` : '';
  return `${type}${sub}${method}${pair}`;
}

// 1 record の表示行。map 内のネストを浅くして複雑度を下げる。
function DayRecordRow({ record }: { record: RecordListItem }) {
  return (
    <li
      // 相手（自分以外）の record は淡色で区別する（自分視点の一覧のため）。
      className={cn(
        'flex items-center justify-between gap-2 rounded-md border px-3 py-2',
        !record.isSelf && 'opacity-60'
      )}
    >
      <span className='flex items-center gap-2'>
        <span
          aria-hidden='true'
          className='inline-block size-3 shrink-0 rounded-full'
          style={{
            backgroundColor: colorHex(
              record.typeColorClassificationName ?? 'yellow'
            )
          }}
        />
        <span className='flex flex-col'>
          <span className='text-sm'>{recordSummary(record)}</span>
          {record.memo ? (
            <span className='text-muted-foreground text-xs'>{record.memo}</span>
          ) : null}
        </span>
      </span>
      <span className='font-medium text-sm'>
        {formatRecordPrice(record.price, resolveDisplayIsPay(record))}
      </span>
    </li>
  );
}

export function DayRecordList({
  dateStr,
  records,
  holidayName
}: DayRecordListProps) {
  if (dateStr === null) {
    return null;
  }

  return (
    <section className='flex flex-col gap-2'>
      <h2 className='flex items-center gap-2 font-bold text-lg'>
        {dateStr}
        {holidayName ? (
          <span className='rounded bg-red-100 px-1.5 py-0.5 text-red-700 text-xs'>
            {holidayName}
          </span>
        ) : null}
      </h2>

      {records.length === 0 ? (
        <p className='text-muted-foreground text-sm'>
          {calendarLabels.empty.dayRecords}
        </p>
      ) : (
        <ul className='flex flex-col gap-2'>
          {records.map((record) => (
            <DayRecordRow key={record.id} record={record} />
          ))}
        </ul>
      )}
    </section>
  );
}
