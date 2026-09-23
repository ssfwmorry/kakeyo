'use client';

import { cn } from 'cn';
import { useEffect, useState, useTransition } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { IconCheck } from '@/components/icons';
import { Button } from '@/components/ui/button';
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';
import { fetchSubTypeAction, fetchTypePeriodAction } from '../actions';
import type { StackShowData } from '../domain/chart-data';
import { currentYear, shiftYear, yearLabel } from '../domain/period';
import type { TypeChipsByQuadrant } from '../types';
import {
  AMOUNT_Y_AXIS_PROPS,
  formatTooltipAmount,
  MONTH_X_AXIS_PROPS
} from './chart-axes';
import { PeriodNav } from './period-nav';

// 推移 > カテゴリ別タブ。
// チップ「全て」= カテゴリ別の積み上げ棒、特定カテゴリ選択 = サブカテゴリ別の積み上げ棒。

type SummaryBarTypeProps = {
  isPair: boolean;
  chips: TypeChipsByQuadrant;
};

const EMPTY: StackShowData = { rows: [], series: [] };

export function SummaryBarType({ isPair, chips }: SummaryBarTypeProps) {
  const [isPending, startTransition] = useTransition();
  const [year, setYear] = useState(currentYear);
  const [isPay, setIsPay] = useState(true);
  // selectedTypeId=null は「全て」。
  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null);
  const [data, setData] = useState<StackShowData>(EMPTY);

  const currentChips =
    chips[isPay ? 'pay' : 'income'][isPair ? 'pair' : 'self'];

  const refetch = (next: {
    year: number;
    isPay: boolean;
    typeId: number | null;
  }) => {
    startTransition(async () => {
      if (next.typeId === null) {
        const result = await fetchTypePeriodAction({
          year: next.year,
          isPay: next.isPay,
          isPair
        });
        setData(result);
        return;
      }
      const result = await fetchSubTypeAction({
        year: next.year,
        typeId: next.typeId
      });
      setData(result);
    });
  };

  // isPair / isPay 変化時は「全て」にリセットして再取得。
  // biome-ignore lint/correctness/useExhaustiveDependencies: isPay/isPair のみをトリガにし他は各ハンドラで再取得
  useEffect(() => {
    setSelectedTypeId(null);
    refetch({ year, isPay, typeId: null });
  }, [isPair]);

  const config: ChartConfig = Object.fromEntries(
    data.series.map((s) => [s.key, { label: s.label, color: s.color }])
  );

  return (
    <div className='flex flex-col gap-3'>
      <div className='inline-flex overflow-hidden rounded-md border self-start'>
        <Button
          type='button'
          variant={isPay ? 'default' : 'ghost'}
          size='sm'
          className='rounded-none'
          onClick={() => {
            setIsPay(true);
            setSelectedTypeId(null);
            refetch({ year, isPay: true, typeId: null });
          }}
        >
          支出
        </Button>
        <Button
          type='button'
          variant={!isPay ? 'default' : 'ghost'}
          size='sm'
          className='rounded-none'
          onClick={() => {
            setIsPay(false);
            setSelectedTypeId(null);
            refetch({ year, isPay: false, typeId: null });
          }}
        >
          収入
        </Button>
      </div>

      {/* カテゴリが増えても縦に伸びないよう、折り返さず横スクロールさせる。
          選択中はチェックマークを付ける（塗りだけだと選択状態が読み取りにくい）。 */}
      <div className='-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1'>
        <ChipButton
          active={selectedTypeId === null}
          onClick={() => {
            setSelectedTypeId(null);
            refetch({ year, isPay, typeId: null });
          }}
          label='全て'
        />
        {currentChips.map((chip) => (
          <ChipButton
            key={chip.typeId}
            active={selectedTypeId === chip.typeId}
            onClick={() => {
              setSelectedTypeId(chip.typeId);
              refetch({ year, isPay, typeId: chip.typeId });
            }}
            label={chip.name}
          />
        ))}
      </div>

      <PeriodNav
        label={yearLabel(year)}
        disabled={isPending}
        onPrev={() => {
          const next = shiftYear(year, -1);
          setYear(next);
          refetch({ year: next, isPay, typeId: selectedTypeId });
        }}
        onNext={() => {
          const next = shiftYear(year, 1);
          setYear(next);
          refetch({ year: next, isPay, typeId: selectedTypeId });
        }}
      />

      {data.series.length > 0 ? (
        <>
          {/* 凡例はグラフの上に置く。 */}
          <ul className='flex flex-wrap gap-x-4 gap-y-1'>
            {data.series.map((s) => (
              <li key={s.key} className='flex items-center gap-1.5 text-xs'>
                <span
                  aria-hidden
                  className='inline-block size-3 rounded-sm'
                  style={{ backgroundColor: s.color }}
                />
                {s.label}
              </li>
            ))}
          </ul>
          <ChartContainer config={config} className='aspect-video w-full'>
            <BarChart data={data.rows} margin={{ left: 4, right: 4, top: 8 }}>
              <CartesianGrid vertical={false} />
              <XAxis {...MONTH_X_AXIS_PROPS} />
              <YAxis {...AMOUNT_Y_AXIS_PROPS} />
              <ChartTooltip
                content={
                  <ChartTooltipContent formatter={formatTooltipAmount} />
                }
              />
              {data.series.map((s) => (
                <Bar
                  key={s.key}
                  dataKey={s.key}
                  name={s.label}
                  stackId='stack'
                  fill={`var(--color-${s.key})`}
                />
              ))}
            </BarChart>
          </ChartContainer>
        </>
      ) : (
        <p className='py-8 text-center text-muted-foreground text-sm'>
          表示するデータがありません
        </p>
      )}
    </div>
  );
}

function ChipButton({
  active,
  onClick,
  label
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type='button'
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'flex shrink-0 items-center gap-1 rounded-full px-3 py-1 text-xs',
        active ? 'bg-primary text-primary-foreground' : 'border'
      )}
    >
      {active ? <IconCheck className='size-3' aria-hidden /> : null}
      {label}
    </button>
  );
}
