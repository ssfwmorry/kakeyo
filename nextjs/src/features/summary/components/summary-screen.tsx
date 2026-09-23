'use client';

import { useState } from 'react';
import {
  IconAnalytics,
  IconCash,
  IconChartBar,
  IconChartPie,
  IconShape
} from '@/components/icons';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { PairedRecordItem } from '@/features/record';
import type { Id } from '@/lib/shared/types/id';
import type { TypeChipsByQuadrant } from '../types';
import { SummaryBar } from './summary-bar';
import { SummaryBarType } from './summary-bar-type';
import { SummaryPie } from './summary-pie';
import { SummarySettlement } from './summary-settlement';

// 各タブは Client で年月/トグルを変えて Server Action から再取得する。

type SummaryScreenProps = {
  isPair: boolean;
  isExistPair: boolean;
  typeChips: TypeChipsByQuadrant;
  // 精算タブ初期データ（Server で取得済み。精算後は revalidate で更新される）。
  pairedRecords: PairedRecordItem[];
  settlementMethods: { id: Id; name: string }[];
  yearMonth: string;
};

const OUTER = { pie: 'pie', trend: 'trend', settlement: 'settlement' } as const;
const TREND = { total: 'total', type: 'type' } as const;

export function SummaryScreen({
  isPair,
  isExistPair,
  typeChips,
  pairedRecords,
  settlementMethods,
  yearMonth
}: SummaryScreenProps) {
  const [outer, setOuter] = useState<string>(OUTER.pie);
  const [trend, setTrend] = useState<string>(TREND.total);

  return (
    <main className='mx-auto flex w-full max-w-md flex-col gap-4 p-4'>
      <h1 className='font-bold text-lg'>集計</h1>
      <Tabs value={outer} onValueChange={setOuter}>
        <TabsList className='w-full'>
          <TabsTrigger value={OUTER.pie}>
            <IconChartPie className='size-4' aria-hidden />
            内訳
          </TabsTrigger>
          <TabsTrigger value={OUTER.trend}>
            <IconChartBar className='size-4' aria-hidden />
            推移
          </TabsTrigger>
          {isExistPair ? (
            <TabsTrigger value={OUTER.settlement}>
              <IconCash className='size-4' aria-hidden />
              精算
            </TabsTrigger>
          ) : null}
        </TabsList>

        <TabsContent value={OUTER.pie}>
          <SummaryPie isPair={isPair} isExistPair={isExistPair} />
        </TabsContent>

        <TabsContent value={OUTER.trend}>
          <Tabs value={trend} onValueChange={setTrend}>
            <TabsList className='w-full'>
              <TabsTrigger value={TREND.total}>
                <IconAnalytics className='size-4' aria-hidden />
                全体
              </TabsTrigger>
              <TabsTrigger value={TREND.type}>
                <IconShape className='size-4' aria-hidden />
                カテゴリ別
              </TabsTrigger>
            </TabsList>
            <TabsContent value={TREND.total}>
              <SummaryBar isPair={isPair} isExistPair={isExistPair} />
            </TabsContent>
            <TabsContent value={TREND.type}>
              <SummaryBarType isPair={isPair} chips={typeChips} />
            </TabsContent>
          </Tabs>
        </TabsContent>

        {isExistPair ? (
          <TabsContent value={OUTER.settlement}>
            <SummarySettlement
              records={pairedRecords}
              methods={settlementMethods}
              yearMonth={yearMonth}
            />
          </TabsContent>
        ) : null}
      </Tabs>
    </main>
  );
}
