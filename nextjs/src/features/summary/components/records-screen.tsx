'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { IconChevronLeft } from '@/components/icons';
import { ShareBadge } from '@/components/share-badge';
import { Button } from '@/components/ui/button';
import { RecordCard, type SummarizedRecordItem } from '@/features/record';
import { formatDateLabelJst, toDateStringJst } from '@/lib/shared/domain/date';
import { colorHex } from '../color';
import { toShowStr } from '../domain/format';
import { monthLabel, shiftMonth } from '../domain/period';
import { fetchSummarizedRecordsAction } from '../records-actions';
import type { RecordsQuery } from '../records-query';
import { PeriodNav } from './period-nav';

// summary（内訳）から遷移した条件の record 一覧。records は個人専用扱いのためペア切替は出さない。

type RecordsScreenProps = {
  query: RecordsQuery;
  initialRecords: SummarizedRecordItem[];
};

export function RecordsScreen({ query, initialRecords }: RecordsScreenProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [yearMonth, setYearMonth] = useState(query.yearMonth);
  const [records, setRecords] = useState(initialRecords);

  const total = records.reduce((sum, r) => sum + r.price, 0);

  const goYearMonth = (next: string) => {
    setYearMonth(next);
    startTransition(async () => {
      const result = await fetchSummarizedRecordsAction({
        ...query,
        yearMonth: next
      });
      setRecords(result);
    });
  };
  const move = (delta: number) => goYearMonth(shiftMonth(yearMonth, delta));

  const groups = groupByDate(records);

  const heading = query.isType
    ? query.isPay
      ? '支出カテゴリ'
      : '収入カテゴリ'
    : query.isPay
      ? '支払方法'
      : '受取方法';

  return (
    <main className='mx-auto flex w-full max-w-md flex-col gap-3 p-4'>
      {/* 上部にブルーグレーの色帯ヘッダを敷き、右に絞り込み中のカテゴリを枠付きカードで
          出す。帯もカードも無いと「今どの絞り込みを見ているか」の手がかりが弱い。 */}
      <div className='-mx-4 -mt-4 flex items-center justify-between gap-2 bg-slate-200 px-4 py-2 dark:bg-slate-700'>
        <Button
          type='button'
          variant='ghost'
          size='sm'
          onClick={() => router.push('/summary')}
          aria-label='集計へ戻る'
        >
          <IconChevronLeft className='size-4' aria-hidden />
        </Button>
        <div className='flex min-w-0 flex-col items-end gap-0.5'>
          <span className='text-muted-foreground text-xs'>{heading}</span>
          {/* カテゴリ名カード（色マーカー＋共有アイコン＋名前）。 */}
          <div className='flex min-w-0 items-center gap-2 rounded-md border bg-background px-2 py-1'>
            <ShareBadge
              colorHex={colorHex(query.colorName)}
              isPair={query.isPair}
              className='size-4'
            />
            <span className='truncate text-sm'>
              {query.pairUserName ? (
                <span className='mr-1 text-muted-foreground text-xs'>
                  {query.pairUserName}
                </span>
              ) : null}
              {query.name}
            </span>
          </div>
          {/* 立替込み/自分のみ（絞り込み条件として明示する）。 */}
          <span className='text-muted-foreground text-xs'>
            {query.isIncludeInstead ? '立替込み' : '自分のみ'}
          </span>
        </div>
      </div>

      <PeriodNav
        label={monthLabel(yearMonth)}
        subtitle={`合計: ${toShowStr(total)} 円`}
        disabled={isPending}
        jumpYearMonth={yearMonth}
        onJump={goYearMonth}
        onPrev={() => move(-1)}
        onNext={() => move(1)}
      />

      {records.length === 0 ? (
        <p className='py-8 text-center text-muted-foreground text-sm'>
          表示するデータがありません
        </p>
      ) : (
        <div className='flex flex-col gap-3'>
          {groups.map((group) => (
            <div key={group.date} className='flex flex-col gap-1'>
              <p className='text-muted-foreground text-xs'>
                {formatDateLabelJst(group.date)}
              </p>
              {group.records.map((record) => (
                <RecordCard
                  key={record.id}
                  record={record}
                  // 編集可否は RecordCard 内の isEnableEdit で判定。編集可のときのみ
                  // note 編集へ遷移する（ペア相手の立替 record は編集導線が出ない）。
                  onEdit={() => router.push(`/note?RECORD=${record.id}`)}
                />
              ))}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

type DateGroup = { date: string; records: SummarizedRecordItem[] };

// datetime を JST 日付でグルーピング。入力の出現順（降順前提）を保つ。
function groupByDate(records: SummarizedRecordItem[]): DateGroup[] {
  const groups: DateGroup[] = [];
  const indexByDate = new Map<string, number>();
  for (const record of records) {
    const date = toDateStringJst(record.datetime);
    let index = indexByDate.get(date);
    if (index === undefined) {
      index = groups.length;
      indexByDate.set(date, index);
      groups.push({ date, records: [] });
    }
    groups[index].records.push(record);
  }
  return groups;
}
