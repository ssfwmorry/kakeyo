'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { RecordCard, type SummarizedRecordItem } from '@/features/record';
import { toDateStringJst } from '@/lib/shared/domain/date';
import { colorHex } from '../color';
import { toShowStr } from '../domain/format';
import { monthLabel, shiftMonth } from '../domain/period';
import { fetchSummarizedRecordsAction } from '../records-actions';
import type { RecordsQuery } from '../records-query';
import { PeriodNav } from './period-nav';

// records 明細画面（旧 pages/records.vue）。summary（内訳）から遷移した条件の record 一覧。
// 月移動 / 合計表示 / record カード → note 編集遷移 / ＜ で summary へ戻る。
// records は個人専用扱い（ペア切替は出さない・PAGES_WITHOUT_PAIR）。

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

  // 指定の年月へ移動して再取得する（前後移動・年月ジャンプ共通）。
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

  // 日付ごとにグルーピング（降順で来る前提）。
  const groups = groupByDate(records);

  // 見出し（支出/収入 カテゴリ or 支払/受取 方法）。
  const heading = query.isType
    ? query.isPay
      ? '支出カテゴリ'
      : '収入カテゴリ'
    : query.isPay
      ? '支払方法'
      : '受取方法';

  return (
    <main className='mx-auto flex w-full max-w-md flex-col gap-3 p-4'>
      <div className='flex items-center justify-between gap-2'>
        <Button
          type='button'
          variant='outline'
          size='sm'
          onClick={() => router.push('/summary')}
          aria-label='集計へ戻る'
        >
          ＜
        </Button>
        <div className='flex items-center gap-2'>
          <span
            aria-hidden
            className='inline-block size-3 rounded-full'
            style={{ backgroundColor: colorHex(query.colorName) }}
          />
          <span className='text-sm'>
            {query.pairUserName ? (
              <span className='mr-1 text-muted-foreground text-xs'>
                {query.pairUserName}
              </span>
            ) : null}
            {query.name}
          </span>
        </div>
        <span className='w-9' />
      </div>

      <p className='text-muted-foreground text-xs'>{heading}</p>

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
              <p className='text-muted-foreground text-xs'>{group.date}</p>
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

// datetime を JST 日付でグルーピング（入力は降順前提。出現順を保つ）。
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
