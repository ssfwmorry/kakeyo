import type { Id } from '@/lib/shared/types/id';
import { isValidRateIndex, RATE_LIST } from './settlement-rate';

// 精算の按分・差額算出（旧 SummarySettlement.vue の reportedDataByRate /
// settlementResult / getRecordIdList を純粋関数として移植）。server-only を含まない
// （Client / Vitest 対象）。DB / React に触れない。
//
// 用語（旧踏襲）:
// - isMe: その record を「自分」が立て替えたか（ME グループ = true、PARTNER = false）。
// - rate: 自分が負担すべき割合（RATE_LIST[rateIndex]）。
// - toBe: 自分が本来負担すべき額 = round(合計 * rate)。
// - asIs: 自分が実際に払った額 = 自分立替（isMe）の合計。
// - diff: toBe - asIs = 自分がまだ負担していない（払うべき）額。
//   全レートの diff 合計が正なら「お渡し」（自分が相手へ送る）、負なら「受け取り」。

// 1 件の record に対するレート割当（UI が組み立てる入力）。
export type RateAssignment = {
  id: Id;
  price: number;
  isMe: boolean;
  // RATE_LIST のインデックス（0〜10）。
  rateIndex: number;
};

// レート単位の集計結果（旧 reportedDataByRate の 1 要素 + 表示用 rateIndex）。
export type RateReport = {
  rateIndex: number;
  sum: number;
  asIs: number;
  toBe: number;
  diff: number;
};

// 割当を rateIndex ごとに集計する。並びは rateIndex 昇順（表示安定のため）。
export function summarizeByRate(assignments: RateAssignment[]): RateReport[] {
  // rateIndex → { sum, asIs } を集計。範囲外の rateIndex は RATE_LIST[i]=undefined で
  // toBe が NaN になり家計の数字を壊すため、集計前に弾く（UI は 0〜10 しか渡さない前提の
  // 防御。呼び出し側の不正データでドメイン計算が破綻しないようにする）。
  const byIndex = new Map<number, { sum: number; asIs: number }>();
  for (const a of assignments) {
    if (!isValidRateIndex(a.rateIndex)) {
      continue;
    }
    const acc = byIndex.get(a.rateIndex) ?? { sum: 0, asIs: 0 };
    acc.sum += a.price;
    if (a.isMe) {
      acc.asIs += a.price;
    }
    byIndex.set(a.rateIndex, acc);
  }

  return [...byIndex.entries()]
    .sort(([a], [b]) => a - b)
    .map(([rateIndex, { sum, asIs }]) => {
      const toBe = Math.round(sum * RATE_LIST[rateIndex]);
      return { rateIndex, sum, asIs, toBe, diff: toBe - asIs };
    });
}

// 全レートの差額合計（旧 settlementResult の元になる ret）。
// 正 = 自分が相手へ「お渡し」、負 = 相手から「受け取り」、0 = 精算不要。
export function totalSettlementDiff(reports: RateReport[]): number {
  return reports.reduce((sum, r) => sum + r.diff, 0);
}

// 精算の向きと金額（旧 settlementResult / endSettlement の isPay=ret>0・price=|ret|）。
export type SettlementDirection = {
  // 精算が必要か（diff 合計が 0 なら不要）。
  needed: boolean;
  // 支払（自分→相手）なら true、受取なら false。needed=false のときは無意味。
  isPay: boolean;
  // 精算金額（常に非負。|diff 合計|）。
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

// 精算対象 record の id 一覧（旧 getRecordIdList）。settleRecords へ渡す。
export function collectAssignedIds(assignments: RateAssignment[]): Id[] {
  return assignments.map((a) => a.id);
}
