'use client';

import { Cell, Pie, PieChart } from 'recharts';
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';
import type { PieSlice } from '../domain/chart-data';

// 内訳の円グラフ（Recharts Pie + shadcn chart）。
// 色は各スライスが持つ hex（slice.fill）を Cell で当てる。
// 値は絶対量で描く（収入/支出は呼び出し側でフィルタ済み・符号は扱わない）。

type SummaryPieChartProps = {
  slices: PieSlice[];
};

export function SummaryPieChart({ slices }: SummaryPieChartProps) {
  if (slices.length === 0) {
    return null;
  }

  // ChartConfig は tooltip のラベル解決に使う。key はスライス名。
  const config: ChartConfig = Object.fromEntries(
    slices.map((slice) => [
      slice.name,
      { label: slice.name, color: slice.fill }
    ])
  );

  return (
    <ChartContainer
      config={config}
      className='mx-auto aspect-square w-full max-w-72'
    >
      <PieChart>
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value) =>
                `${Math.abs(Number(value)).toLocaleString()} 円`
              }
            />
          }
        />
        <Pie
          data={slices}
          dataKey='value'
          nameKey='name'
          innerRadius={0}
          outerRadius={110}
        >
          {slices.map((slice) => (
            <Cell key={slice.name} fill={slice.fill} />
          ))}
        </Pie>
      </PieChart>
    </ChartContainer>
  );
}
