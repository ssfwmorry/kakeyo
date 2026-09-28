import type { Id } from '@/lib/shared/types/id';
import { isValidRateIndex, RATE_LIST } from './settlement-rate';

// 精算の按分・差額の計算。純粋関数（DB / React に触れない）。
//
// 用語:
// - isMe: その record を「自分」が立て替えたか。
// - rate: 自分が負担すべき割合（RATE_LIST[rateIndex]）。
// - toBe: 自分が本来負担すべき額 = round(合計 * rate)。
// - asIs: 自分が実際に払った額 = 自分の立替の合計。
// - diff: toBe - asIs = 自分がまだ負担していない額。
//   全グループの diff の合計が正なら自分が相手へ渡す、負なら受け取る。

// 1 件の record に対する率の割当（画面が組み立てる入力）。
export type RateAssignment = {
  id: Id;
  price: number;
  isMe: boolean;
  // RATE_LIST の index（0〜10）。
  rateIndex: number;
};

// 率ごとの集計。
export type RateReport = {
  rateIndex: number;
  sum: number;
  asIs: number;
  toBe: number;
  diff: number;
};

// 割当を rateIndex ごとに集計する。並びは rateIndex 昇順。
export function summarizeByRate(assignments: RateAssignment[]): RateReport[] {
  // 範囲外の rateIndex は RATE_LIST[i] が undefined で toBe が NaN になり家計の数字を
  // 壊すので、集計の前に弾く。
  const byIndex = new Map<number, { sum: number; asIs: number }>();
  for (const assignment of assignments) {
    if (!isValidRateIndex(assignment.rateIndex)) {
      continue;
    }
    const acc = byIndex.get(assignment.rateIndex) ?? { sum: 0, asIs: 0 };
    acc.sum += assignment.price;
    if (assignment.isMe) {
      acc.asIs += assignment.price;
    }
    byIndex.set(assignment.rateIndex, acc);
  }

  return [...byIndex.entries()]
    .sort(([a], [b]) => a - b)
    .map(([rateIndex, { sum, asIs }]) => {
      const toBe = Math.round(sum * RATE_LIST[rateIndex]);
      return { rateIndex, sum, asIs, toBe, diff: toBe - asIs };
    });
}

// 全グループの差額の合計。正 = 自分が渡す、負 = 受け取る、0 = 精算不要。
export function totalSettlementDiff(reports: RateReport[]): number {
  return reports.reduce((sum, report) => sum + report.diff, 0);
}

export type SettlementDirection = {
  // 精算が要るか（差額の合計が 0 なら要らない）。
  needed: boolean;
  // 自分が相手へ渡すなら true、受け取るなら false。needed=false のときは意味を持たない。
  isPay: boolean;
  // 精算金額（常に非負）。
  price: number;
};

export function resolveSettlement(
  assignments: RateAssignment[]
): SettlementDirection {
  const total = totalSettlementDiff(summarizeByRate(assignments));
  return {
    needed: total !== 0,
    isPay: total > 0,
    price: Math.abs(total)
  };
}

// 精算済みにする record の id 一覧。
export function collectAssignedIds(assignments: RateAssignment[]): Id[] {
  return assignments.map((assignment) => assignment.id);
}
