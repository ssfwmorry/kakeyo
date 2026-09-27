'use client';

import { useRouter } from 'next/navigation';
import { Segment, type SegmentOption } from '@/components/ui/segment';
import { summaryLabels } from '../labels';

// 集計の 3 タブ（内訳・推移・精算）。原典では別画面なので、選ぶとそのルートへ移る。
//
// 精算はペアがいるときだけ出す（原典 SumSettle。ペアが無ければタブは 2 つになる）。

export type SummaryTab = 'breakdown' | 'trend' | 'settlement';

const HREF: Record<SummaryTab, string> = {
  breakdown: '/summary',
  trend: '/summary/trend',
  settlement: '/summary/settlement'
};

export function SummaryTabs({
  current,
  hasPair
}: {
  current: SummaryTab;
  hasPair: boolean;
}) {
  const router = useRouter();

  const options: SegmentOption<SummaryTab>[] = [
    { value: 'breakdown', label: summaryLabels.tab.breakdown },
    { value: 'trend', label: summaryLabels.tab.trend }
  ];
  if (hasPair) {
    options.push({
      value: 'settlement',
      label: summaryLabels.tab.settlement
    });
  }

  return (
    <Segment
      label='集計の種類'
      onChange={(value) => {
        if (value !== current) {
          router.push(HREF[value]);
        }
      }}
      options={options}
      value={current}
    />
  );
}
