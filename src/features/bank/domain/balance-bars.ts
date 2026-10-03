import {
  buildStackedChartBars,
  type ChartBars
} from '@/lib/shared/domain/bar-chart';
import type { BalanceBucket } from './balance-buckets';

// 区間ごとの残高を口座の積み上げ棒にする。口座の並び = 下から積む順。
// 未登録（null）の口座は 0 として積み上げに寄与させない。空の区間は高さ 0。
export function buildBalanceBars(
  buckets: Pick<BalanceBucket, 'key' | 'label' | 'prices'>[],
  banks: Array<{ id: number; colorName: string }>,
  toColor: (colorName: string) => string
): ChartBars {
  return buildStackedChartBars(
    buckets.map((bucket) => ({
      key: bucket.key,
      label: bucket.label,
      values: banks.map((_, index) => bucket.prices[index] ?? 0)
    })),
    banks.map((bank) => ({
      key: String(bank.id),
      color: toColor(bank.colorName)
    }))
  );
}
