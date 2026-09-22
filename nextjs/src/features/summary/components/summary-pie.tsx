'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { fetchPieAction } from '../actions';
import { colorHex } from '../color';
import type { PieListRow, PieShowData } from '../domain/chart-data';
import { toShowStr, toShowStrWithIsPay } from '../domain/format';
import { currentYearMonth, monthLabel, shiftMonth } from '../domain/period';
import { toRecordsSearchParams } from '../records-query';
import { PeriodNav } from './period-nav';
import { SummaryPieChart } from './summary-pie-chart';

// 内訳タブ（旧 SummaryPie.vue）。カテゴリ別/方法別の円グラフ + 一覧。
// トグル（支出/収入・カテゴリ/方法・立替込み）と月移動で Server Action を再取得する。

type SummaryPieProps = {
  isPair: boolean;
  isExistPair: boolean;
};

export function SummaryPie({ isPair, isExistPair }: SummaryPieProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isPay, setIsPay] = useState(true);
  const [isType, setIsType] = useState(true);
  const [isIncludeInstead, setIsIncludeInstead] = useState(true);
  const [yearMonth, setYearMonth] = useState(currentYearMonth);
  const [data, setData] = useState<PieShowData>({ slices: [], list: [] });

  // 立替込みトグルは「ペアあり かつ 個人モード」時のみ意味を持つ（旧 FE 踏襲）。
  const showInsteadToggle = isExistPair && !isPair;

  const refetch = (next: {
    isPay: boolean;
    isType: boolean;
    isIncludeInstead: boolean;
    yearMonth: string;
  }) => {
    startTransition(async () => {
      const result = await fetchPieAction({
        isType: next.isType,
        isPay: next.isPay,
        isPair,
        isIncludeInstead: next.isIncludeInstead,
        yearMonth: next.yearMonth
      });
      setData(result);
    });
  };

  // 初回 + isPair 変化時に取得。
  // biome-ignore lint/correctness/useExhaustiveDependencies: 明示トグルは各ハンドラで再取得するため isPair のみを依存に取る
  useEffect(() => {
    refetch({ isPay, isType, isIncludeInstead, yearMonth });
  }, [isPair]);

  const total = data.list.reduce((sum, row) => sum + row.value, 0);
  const subtitle =
    data.list.length > 0
      ? `合計: ${toShowStrWithIsPay(total, isPay)} 円`
      : undefined;

  const goRecords = (
    row: PieShowData['list'][number],
    sub: { id: number; name: string } | null
  ) => {
    // typeId=null（精算・id<0 のダミー）や方法の負 id は遷移不可。
    if (row.id < 0) {
      return;
    }
    const suffix = sub ? ` - ${sub.name}` : '';
    const params = toRecordsSearchParams({
      id: row.id,
      subTypeId: sub ? sub.id : null,
      isPay,
      isType,
      isPair,
      // 旧 FE の quirk（isExistPair? true : null）は本移植では意味のある値へ正す:
      // 個人モードで立替込みトグルが出るときはその値、それ以外は false。
      isIncludeInstead: showInsteadToggle ? isIncludeInstead : false,
      yearMonth,
      name: row.name + suffix,
      colorName: row.colorName,
      pairUserName: row.pairUserName
    });
    router.push(`/records?${params.toString()}`);
  };

  return (
    <div className='flex flex-col gap-3'>
      <div className='flex flex-wrap gap-2'>
        <ToggleButton
          active={isPay}
          onLeft={() => {
            setIsPay(true);
            refetch({ isPay: true, isType, isIncludeInstead, yearMonth });
          }}
          onRight={() => {
            setIsPay(false);
            refetch({ isPay: false, isType, isIncludeInstead, yearMonth });
          }}
          leftLabel={isType ? '支出' : '支払'}
          rightLabel={isType ? '収入' : '受取'}
        />
        <ToggleButton
          active={isType}
          onLeft={() => {
            setIsType(true);
            refetch({ isPay, isType: true, isIncludeInstead, yearMonth });
          }}
          onRight={() => {
            setIsType(false);
            refetch({ isPay, isType: false, isIncludeInstead, yearMonth });
          }}
          leftLabel='カテゴリ'
          rightLabel='方法'
        />
        {showInsteadToggle ? (
          <ToggleButton
            active={isIncludeInstead}
            onLeft={() => {
              setIsIncludeInstead(true);
              refetch({ isPay, isType, isIncludeInstead: true, yearMonth });
            }}
            onRight={() => {
              setIsIncludeInstead(false);
              refetch({ isPay, isType, isIncludeInstead: false, yearMonth });
            }}
            leftLabel='立替込み'
            rightLabel='自分のみ'
          />
        ) : null}
      </div>

      <PeriodNav
        label={monthLabel(yearMonth)}
        subtitle={subtitle}
        disabled={isPending}
        onPrev={() => {
          const next = shiftMonth(yearMonth, -1);
          setYearMonth(next);
          refetch({ isPay, isType, isIncludeInstead, yearMonth: next });
        }}
        onNext={() => {
          const next = shiftMonth(yearMonth, 1);
          setYearMonth(next);
          refetch({ isPay, isType, isIncludeInstead, yearMonth: next });
        }}
      />

      <SummaryPieChart slices={data.slices} />

      {data.list.length === 0 ? (
        <p className='py-8 text-center text-muted-foreground text-sm'>
          表示するデータがありません
        </p>
      ) : (
        <ul className='flex flex-col gap-1'>
          {data.list.map((row) => (
            <PieListItem
              key={`${isType ? 't' : 'm'}-${row.id}-${row.name}`}
              row={row}
              onGo={goRecords}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

// 内訳一覧の 1 行（カテゴリ/方法 + サブカテゴリ）。＞は id>=0（typeId/methodId が正）のみ。
function PieListItem({
  row,
  onGo
}: {
  row: PieListRow;
  onGo: (row: PieListRow, sub: { id: number; name: string } | null) => void;
}) {
  return (
    <li>
      <div className='flex items-center gap-2 rounded-md border p-2'>
        <span
          aria-hidden
          className='inline-block size-3 shrink-0 rounded-full'
          style={{ backgroundColor: colorHex(row.colorName) }}
        />
        <span className='flex-1 truncate text-sm'>
          {row.isPair && row.pairUserName ? (
            <span className='mr-1 text-muted-foreground text-xs'>
              {row.pairUserName}
            </span>
          ) : null}
          {row.name}
        </span>
        <span className='text-sm tabular-nums'>{toShowStr(row.value)} 円</span>
        {row.id >= 0 ? (
          <Button
            type='button'
            variant='ghost'
            size='sm'
            onClick={() => onGo(row, null)}
            aria-label={`${row.name} の明細へ`}
          >
            ＞
          </Button>
        ) : (
          <span className='w-9' />
        )}
      </div>
      {row.subs.length > 0 ? (
        <ul className='mt-1 ml-5 flex flex-col gap-1'>
          {row.subs.map((sub) => (
            <li
              key={`sub-${sub.id}`}
              className='flex items-center gap-2 rounded-md border border-dashed p-2'
            >
              <span className='flex-1 truncate text-muted-foreground text-sm'>
                {sub.name}
              </span>
              <span className='text-sm tabular-nums'>
                {toShowStr(sub.value)} 円
              </span>
              <Button
                type='button'
                variant='ghost'
                size='sm'
                onClick={() => onGo(row, sub)}
                aria-label={`${sub.name} の明細へ`}
              >
                ＞
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
    </li>
  );
}

// 2 値トグル（左右ボタン）。shadcn に toggle-group が無いため Button で最小実装する。
function ToggleButton({
  active,
  onLeft,
  onRight,
  leftLabel,
  rightLabel
}: {
  active: boolean;
  onLeft: () => void;
  onRight: () => void;
  leftLabel: string;
  rightLabel: string;
}) {
  return (
    <div className='inline-flex overflow-hidden rounded-md border'>
      <Button
        type='button'
        variant={active ? 'default' : 'ghost'}
        size='sm'
        className='rounded-none'
        onClick={onLeft}
      >
        {leftLabel}
      </Button>
      <Button
        type='button'
        variant={!active ? 'default' : 'ghost'}
        size='sm'
        className='rounded-none'
        onClick={onRight}
      >
        {rightLabel}
      </Button>
    </div>
  );
}
