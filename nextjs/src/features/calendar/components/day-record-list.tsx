'use client';

import { useRouter } from 'next/navigation';
import { RecordCard, type RecordListItem } from '@/features/record';
import { formatDateLabelJst } from '@/lib/shared/domain/date';
import { calendarLabels } from '../labels';

// 編集可否（ペア相手の立替は不可・精算は不可）は RecordCard 内の isEnableEdit が
// 判定し、可のときのみ編集ボタンを出す。
// router は各リストで 1 回だけ取得し（行ごとに useRouter を呼ばない）、onEdit を渡す。

export function DayRecordList({ records }: { records: RecordListItem[] }) {
  const router = useRouter();
  if (records.length === 0) {
    return null;
  }

  return (
    <div className='flex flex-col gap-2'>
      {records.map((record) => (
        <RecordCard
          key={record.id}
          record={record}
          onEdit={() => router.push(`/note?RECORD=${record.id}`)}
        />
      ))}
    </div>
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
          <p className='text-muted-foreground text-xs'>
            {formatDateLabelJst(day.dateStr)}
          </p>
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
