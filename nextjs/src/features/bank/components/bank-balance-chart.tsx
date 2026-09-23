'use client';

import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';
import { colorHex } from '@/features/master';
import {
  toAxisMonthLabel,
  toManUnit,
  toTooltipDateLabel
} from '../domain/format';
import type { BalanceChartPoint, BankItem } from '../types';

// 残高の積み上げ Area チャート（Recharts + shadcn chart）。
// 色は「口座（エンティティ）」ごとに固定（DB で口座ごとに色分類を持つ）。
// 系列は口座 = 2 件以上になりうるため legend を常設する。
// 万単位表示で軸・ツールチップを読みやすくする。

type BankBalanceChartProps = {
  banks: BankItem[];
  points: BalanceChartPoint[];
};

export function BankBalanceChart({ banks, points }: BankBalanceChartProps) {
  if (banks.length === 0 || points.length === 0) {
    return null;
  }

  // 口座 → 色・ラベルの ChartConfig。系列 key は bankId（文字列）。
  const config: ChartConfig = Object.fromEntries(
    banks.map((bank) => [
      String(bank.id),
      { label: bank.name, color: colorHex(bank.colorName) }
    ])
  );

  return (
    <ChartContainer config={config} className='aspect-video w-full'>
      <AreaChart data={points} margin={{ left: 4, right: 4, top: 8 }}>
        <CartesianGrid vertical={false} />
        {/* 軸は年月まで（日まで出すとスマホ幅で 1 本しか入らない）。
            日付の精度はツールチップの見出しで担保する。 */}
        <XAxis
          dataKey='date'
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={24}
          tickFormatter={toAxisMonthLabel}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(_label, payload) =>
                toTooltipDateLabel(String(payload?.[0]?.payload?.date ?? ''))
              }
              formatter={(value) => `${toManUnit(Number(value))}万`}
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />
        {banks.map((bank) => {
          const key = String(bank.id);
          return (
            <Area
              key={key}
              dataKey={key}
              name={bank.name}
              type='monotone'
              stackId='balance'
              stroke={`var(--color-${key})`}
              fill={`var(--color-${key})`}
              fillOpacity={0.3}
              strokeWidth={2}
            />
          );
        })}
      </AreaChart>
    </ChartContainer>
  );
}
