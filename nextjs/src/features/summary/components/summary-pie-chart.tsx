'use client';

import { useState } from 'react';
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
//
// 凡例はグラフ上部に出し、ラベルのクリックでそのスライスの表示 ON/OFF を切り替える
// （凡例クリックで系列の表示/非表示を切り替えられるようにする）。
// Recharts の凡例にトグルは無いので、非表示セットを自前の state で持つ。

type SummaryPieChartProps = {
  slices: PieSlice[];
};

export function SummaryPieChart({ slices }: SummaryPieChartProps) {
  // 凡例クリックで隠したスライス名の集合。
  const [hiddenNames, setHiddenNames] = useState<ReadonlySet<string>>(
    () => new Set()
  );

  if (slices.length === 0) {
    return null;
  }

  const toggle = (name: string) =>
    setHiddenNames((prev) => {
      const next = new Set(prev);
      if (!next.delete(name)) {
        next.add(name);
      }
      return next;
    });

  const shownSlices = slices.filter((slice) => !hiddenNames.has(slice.name));

  // ChartConfig は tooltip のラベル解決に使う。key はスライス名。
  const config: ChartConfig = Object.fromEntries(
    slices.map((slice) => [
      slice.name,
      { label: slice.name, color: slice.fill }
    ])
  );

  return (
    <div className='flex flex-col gap-2'>
      {/* 凡例（色↔名前の対応＋クリックで表示切替）。 */}
      <ul className='flex flex-wrap justify-center gap-x-3 gap-y-1'>
        {slices.map((slice) => {
          const isHidden = hiddenNames.has(slice.name);
          return (
            <li key={slice.name}>
              <button
                type='button'
                aria-pressed={!isHidden}
                className={`flex items-center gap-1 text-xs ${
                  isHidden ? 'text-muted-foreground line-through' : ''
                }`}
                onClick={() => toggle(slice.name)}
              >
                <span
                  aria-hidden
                  className='inline-block size-3 rounded-xs'
                  style={{
                    backgroundColor: isHidden ? 'transparent' : slice.fill,
                    boxShadow: `inset 0 0 0 1px ${slice.fill}`
                  }}
                />
                {slice.name}
              </button>
            </li>
          );
        })}
      </ul>

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
            data={shownSlices}
            dataKey='value'
            nameKey='name'
            innerRadius={0}
            outerRadius={110}
          >
            {shownSlices.map((slice) => (
              <Cell key={slice.name} fill={slice.fill} />
            ))}
          </Pie>
        </PieChart>
      </ChartContainer>
    </div>
  );
}
