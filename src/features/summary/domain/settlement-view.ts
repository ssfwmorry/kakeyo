import type { PairedRecordItem } from '@/features/record';
import type { Id } from '@/lib/shared/types/id';
import {
  type RateAssignment,
  type RateReport,
  summarizeByRate
} from './settlement';

// 精算画面の表示用の整形。純粋関数（DB / React に触れない）。
//
// 月のペアの record を 3 つに分ける:
// - couple: 二人のお金（共有・精算）。精算の対象外で、一覧に出すだけ。
// - mine / partner: 立替。精算の対象で、率を割り当てる。

export type SettlementBuckets = {
  couple: PairedRecordItem[];
  mine: PairedRecordItem[];
  partner: PairedRecordItem[];
};

// 日付昇順に並べ直す（サービス層は降順で返す。原典の一覧は月初から並ぶ）。
function byDatetimeAsc(a: PairedRecordItem, b: PairedRecordItem): number {
  return a.datetime.getTime() - b.datetime.getTime() || a.id - b.id;
}

export function splitPairedRecords(
  items: PairedRecordItem[]
): SettlementBuckets {
  const sorted = [...items].sort(byDatetimeAsc);
  return {
    couple: sorted.filter((item) => !item.isInstead),
    mine: sorted.filter((item) => item.isInstead && item.isSelf),
    partner: sorted.filter((item) => item.isInstead && !item.isSelf)
  };
}

// 未精算の立替か。
export function isOpenInstead(item: PairedRecordItem): boolean {
  return item.isInstead && item.isSettled !== true;
}

// 未精算の立替の合計。
export function openSum(items: PairedRecordItem[]): number {
  return items.filter(isOpenInstead).reduce((sum, item) => sum + item.price, 0);
}

// その月の精算の状態。
// - none: 立替が 1 件もない（精算するものがない）。
// - open: 未精算の立替がある。
// - settled: 立替は全て精算済み。
export type SettlementStatus = 'none' | 'open' | 'settled';

export function settlementStatus(buckets: SettlementBuckets): SettlementStatus {
  const insteads = [...buckets.mine, ...buckets.partner];
  if (insteads.length === 0) {
    return 'none';
  }
  return insteads.some(isOpenInstead) ? 'open' : 'settled';
}

// 画面が持つ率の割当（record id → rateIndex）から、按分計算の入力を組む。
// 割当が無い record と精算済みの record は含めない。
export function toAssignments(
  items: PairedRecordItem[],
  rateByRecordId: ReadonlyMap<Id, number>
): RateAssignment[] {
  const assignments: RateAssignment[] = [];
  for (const item of items) {
    const rateIndex = rateByRecordId.get(item.id);
    if (rateIndex === undefined || !isOpenInstead(item)) {
      continue;
    }
    assignments.push({
      id: item.id,
      price: item.price,
      isMe: item.isSelf,
      rateIndex
    });
  }
  return assignments;
}

// 率ごとのグループ（分類の一覧）。集計に加えて、チップに出す各 record の金額を持つ。
export type RateGroup = RateReport & {
  chips: { id: Id; price: number; isMe: boolean }[];
};

export function buildRateGroups(assignments: RateAssignment[]): RateGroup[] {
  return summarizeByRate(assignments).map((report) => ({
    ...report,
    chips: assignments
      .filter((assignment) => assignment.rateIndex === report.rateIndex)
      .map(({ id, price, isMe }) => ({ id, price, isMe }))
  }));
}
