'use client';

import { useEffect, useState, useTransition } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { fetchPayIncomeAction } from '../actions';
import type { PayIncomeShowData } from '../domain/chart-data';
import { toShowPrefixStr, toShowStr } from '../domain/format';
import { currentYear, yearLabel } from '../domain/period';
import { PeriodNav } from './period-nav';

// 推移 > 全体タブ（旧 SummaryBar.vue）。年次の月別 支出/収支 棒グラフ + テーブル。
// 収支/支出のみトグルは取得済みデータの表示切替（再取得しない）。立替込みは再取得する。

// 棒グラフの系列設定（props/state に依存しない定数）。ChartContainer が
// --color-payAndIncome / --color-pay を供給し、Bar が dataKey で切り替える。
const CHART_CONFIG: ChartConfig = {
  payAndIncome: { label: '収支', color: '#2196f3' },
  pay: { label: '支出', color: '#2196f3' }
};

type SummaryBarProps = {
  isPair: boolean;
  isExistPair: boolean;
};

const EMPTY: PayIncomeShowData = { rows: [], sumPay: 0, sumPayAndIncome: 0 };

export function SummaryBar({ isPair, isExistPair }: SummaryBarProps) {
  const [isPending, startTransition] = useTransition();
  const [year, setYear] = useState(currentYear);
  const [isPayAndIncome, setIsPayAndIncome] = useState(true);
  const [isIncludeInstead, setIsIncludeInstead] = useState(true);
  const [data, setData] = useState<PayIncomeShowData>(EMPTY);

  const showInsteadToggle = isExistPair && !isPair;

  const refetch = (next: { year: number; isIncludeInstead: boolean }) => {
    startTransition(async () => {
      const result = await fetchPayIncomeAction({
        year: next.year,
        isPair,
        isIncludeInstead: next.isIncludeInstead
      });
      setData(result);
    });
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: トグル操作は各ハンドラで再取得するため isPair のみ依存
  useEffect(() => {
    refetch({ year, isIncludeInstead });
  }, [isPair]);

  const dataKey = isPayAndIncome ? 'payAndIncome' : 'pay';
  const subtitle = isPayAndIncome
    ? `合計: ${toShowPrefixStr(-1 * data.sumPayAndIncome)} 円`
    : `合計: ${toShowStr(data.sumPay)} 円`;

  return (
    <div className='flex flex-col gap-3'>
      <div className='flex flex-wrap gap-2'>
        <div className='inline-flex overflow-hidden rounded-md border'>
          <button
            type='button'
            className={cell(isPayAndIncome)}
            onClick={() => setIsPayAndIncome(true)}
          >
            収支
          </button>
          <button
            type='button'
            className={cell(!isPayAndIncome)}
            onClick={() => setIsPayAndIncome(false)}
          >
            支出のみ
          </button>
        </div>
        {showInsteadToggle ? (
          <div className='inline-flex overflow-hidden rounded-md border'>
            <button
              type='button'
              className={cell(isIncludeInstead)}
              onClick={() => {
                setIsIncludeInstead(true);
                refetch({ year, isIncludeInstead: true });
              }}
            >
              立替込み
            </button>
            <button
              type='button'
              className={cell(!isIncludeInstead)}
              onClick={() => {
                setIsIncludeInstead(false);
                refetch({ year, isIncludeInstead: false });
              }}
            >
              自分のみ
            </button>
          </div>
        ) : null}
      </div>

      <PeriodNav
        label={yearLabel(year)}
        subtitle={subtitle}
        disabled={isPending}
        onPrev={() => {
          const next = year - 1;
          setYear(next);
          refetch({ year: next, isIncludeInstead });
        }}
        onNext={() => {
          const next = year + 1;
          setYear(next);
          refetch({ year: next, isIncludeInstead });
        }}
      />

      {data.rows.length > 0 ? (
        <ChartContainer config={CHART_CONFIG} className='aspect-video w-full'>
          <BarChart data={data.rows} margin={{ left: 4, right: 4, top: 8 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey='month'
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => `${Number(value).toLocaleString()} 円`}
                />
              }
            />
            <Bar
              dataKey={dataKey}
              fill={`var(--color-${dataKey})`}
              radius={2}
            />
          </BarChart>
        </ChartContainer>
      ) : (
        <p className='py-8 text-center text-muted-foreground text-sm'>
          表示するデータがありません
        </p>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>月</TableHead>
            <TableHead className='text-right'>支出</TableHead>
            <TableHead className='text-right'>収入</TableHead>
            <TableHead className='text-right'>収支</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.rows.map((row) => (
            <TableRow key={row.month}>
              <TableCell>{row.month}</TableCell>
              <TableCell className='text-right tabular-nums'>
                {row.pay.toLocaleString()}
              </TableCell>
              <TableCell className='text-right tabular-nums'>
                {row.income.toLocaleString()}
              </TableCell>
              <TableCell
                className={`text-right tabular-nums ${balanceClass(row.payAndIncome)}`}
              >
                {row.payAndIncome.toLocaleString()}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// トグルセルの class（active で塗り）。
function cell(active: boolean): string {
  return active
    ? 'bg-primary px-3 py-1.5 font-medium text-primary-foreground text-sm'
    : 'px-3 py-1.5 text-sm';
}

// 収支の符号で色分け（0=無色 / 正=青 / 負=赤。旧 FE 踏襲）。
function balanceClass(value: number): string {
  if (value > 0) {
    return 'text-blue-600';
  }
  if (value < 0) {
    return 'text-red-600';
  }
  return '';
}
