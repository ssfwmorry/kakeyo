'use client';

import { useRouter } from 'next/navigation';
import { RecordCard, type RecordListItem } from '@/features/record';
import { calendarLabels } from '../labels';

// 編集可否（ペア相手の立替は不可・精算は不可）は RecordCard 内の isEnableEdit が
// 判定し、可のときのみ編集ボタンを出す。
// router は各リストで 1 回だけ取得し（行ごとに useRouter を呼ばない）、onEdit を渡す。

type DayRecordListProps = {
  dateStr: string | null;
  records: RecordListItem[];
  holidayName: string | null;
};

export function DayRecordList({
  dateStr,
  records,
  holidayName
}: DayRecordListProps) {
  const router = useRouter();
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
        <div className='flex flex-col gap-2'>
          {records.map((record) => (
            <RecordCard
              key={record.id}
              record={record}
              onEdit={() => router.push(`/note?RECORD=${record.id}`)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

// 親（calendar-screen）が month.days を並べ替え・フィルタして「記録のある日」のみ渡す。
type AllRecordsListProps = {
  // records は 1 件以上・並び順は親が決める。
  days: { dateStr: string; records: RecordListItem[] }[];
};

export function AllRecordsList({ days }: AllRecordsListProps) {
  const router = useRouter();
  if (days.length === 0) {
    return (
      <p className='text-muted-foreground text-sm'>
        {calendarLabels.empty.monthRecords}
      </p>
    );
  }
  return (
    <section className='flex flex-col gap-3'>
      {days.map((day) => (
        <div key={day.dateStr} className='flex flex-col gap-1'>
          <p className='text-muted-foreground text-xs'>{day.dateStr}</p>
          {day.records.map((record) => (
            <RecordCard
              key={record.id}
              record={record}
              onEdit={() => router.push(`/note?RECORD=${record.id}`)}
            />
          ))}
        </div>
      ))}
    </section>
  );
}
