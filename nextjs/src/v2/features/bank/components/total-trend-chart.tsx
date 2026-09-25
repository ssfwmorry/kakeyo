'use client';

import { Line, LineChart, XAxis, YAxis } from 'recharts';
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';
import type { TableRow } from '@/features/bank';
import { toAxisMonthLabel } from '@/features/bank/domain/format';

// 総資産の推移。新デザインは口座ごとの積み上げではなく合計 1 本の折れ線にする
// （デザイン基礎 Bank）。内訳は下のリストで見せるので、ここは増減の形だけを出す。
//
// 色はアクセント。トークン（--primary）を参照するのでテーマ切替に追従する。

const CHART_CONFIG: ChartConfig = {
  sum: { label: '総資産', color: 'var(--primary)' }
};

export function TotalTrendChart({ rows }: { rows: TableRow[] }) {
  // 合計が出せる記録だけを描く。1 点では線にならないので出さない。
  const points = rows
    .filter((row) => row.sum !== null)
    .map((row) => ({ date: row.createdDate, sum: row.sum }));

  if (points.length < 2) {
    return null;
  }

  return (
    <ChartContainer className='aspect-[10/3] w-full' config={CHART_CONFIG}>
      <LineChart data={points} margin={{ left: 4, right: 8, top: 8 }}>
        <XAxis
          axisLine={false}
          dataKey='date'
          minTickGap={24}
          tickFormatter={toAxisMonthLabel}
          tickLine={false}
          tickMargin={8}
        />
        {/* 軸の目盛りは出さないが、値域を線の上下に余白付きで取りたいので
            YAxis 自体は置く（hide で目盛りだけ消す）。 */}
        <YAxis domain={['dataMin', 'dataMax']} hide />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Line
          dataKey='sum'
          dot={false}
          stroke='var(--color-sum)'
          strokeWidth={2.5}
          type='monotone'
        />
      </LineChart>
    </ChartContainer>
  );
}
