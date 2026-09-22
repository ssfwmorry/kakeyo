import { describe, expect, it } from 'vitest';
import {
  collectAssignedIds,
  type RateAssignment,
  resolveSettlement,
  summarizeByRate,
  totalSettlementDiff
} from './settlement';

// rateIndex の意味: 0=10:0(自分全額), 5=割り勘, 10=0:10(相手全額)。RATE_LIST=[1,.9,..,0]。

describe('summarizeByRate', () => {
  it('割り勘（rateIndex=5）: 自分が全額立て替えたら半額が diff（お渡し）', () => {
    // 自分が 1000 円立替、割り勘 → toBe=500, asIs=1000, diff=-500（払い過ぎ=受け取り）。
    const assignments: RateAssignment[] = [
      { id: 1, price: 1000, isMe: true, rateIndex: 5 }
    ];
    const [report] = summarizeByRate(assignments);
    expect(report).toEqual({
      rateIndex: 5,
      sum: 1000,
      asIs: 1000,
      toBe: 500,
      diff: -500
    });
  });

  it('割り勘: 相手が全額立て替えたら自分は半額を払う（お渡し）', () => {
    // 相手が 1000 円立替、割り勘 → toBe=500(自分負担), asIs=0, diff=+500（お渡し）。
    const assignments: RateAssignment[] = [
      { id: 1, price: 1000, isMe: false, rateIndex: 5 }
    ];
    const [report] = summarizeByRate(assignments);
    expect(report).toEqual({
      rateIndex: 5,
      sum: 1000,
      asIs: 0,
      toBe: 500,
      diff: 500
    });
  });

  it('自分全額負担（rateIndex=0, rate=1）: 相手立替なら全額お渡し', () => {
    const [report] = summarizeByRate([
      { id: 1, price: 800, isMe: false, rateIndex: 0 }
    ]);
    expect(report.toBe).toBe(800);
    expect(report.diff).toBe(800);
  });

  it('相手全額負担（rateIndex=10, rate=0）: 自分立替なら全額受け取り', () => {
    const [report] = summarizeByRate([
      { id: 1, price: 800, isMe: true, rateIndex: 10 }
    ]);
    expect(report.toBe).toBe(0);
    expect(report.diff).toBe(-800);
  });

  it('端数は四捨五入（round）', () => {
    // sum=999, rate=0.7 → 699.3 → round=699。
    const [report] = summarizeByRate([
      { id: 1, price: 999, isMe: false, rateIndex: 3 }
    ]);
    expect(report.toBe).toBe(699);
  });

  it('同一 rateIndex の複数 record を合算する', () => {
    const reports = summarizeByRate([
      { id: 1, price: 1000, isMe: true, rateIndex: 5 },
      { id: 2, price: 500, isMe: false, rateIndex: 5 }
    ]);
    expect(reports).toHaveLength(1);
    expect(reports[0]).toMatchObject({ sum: 1500, asIs: 1000, toBe: 750 });
  });

  it('複数 rateIndex は index 昇順で返す', () => {
    const reports = summarizeByRate([
      { id: 1, price: 100, isMe: true, rateIndex: 8 },
      { id: 2, price: 100, isMe: true, rateIndex: 2 }
    ]);
    expect(reports.map((r) => r.rateIndex)).toEqual([2, 8]);
  });

  it('範囲外の rateIndex は集計から除外する（NaN 防止）', () => {
    // rateIndex=11 や負数は RATE_LIST に無く toBe が NaN になるため弾く。
    const reports = summarizeByRate([
      { id: 1, price: 100, isMe: true, rateIndex: 11 },
      { id: 2, price: 100, isMe: true, rateIndex: -1 },
      { id: 3, price: 100, isMe: false, rateIndex: 5 }
    ]);
    expect(reports).toHaveLength(1);
    expect(reports[0].rateIndex).toBe(5);
    expect(Number.isNaN(reports[0].toBe)).toBe(false);
  });
});

describe('totalSettlementDiff / resolveSettlement', () => {
  it('diff 合計 0 なら精算不要', () => {
    // 自分 1000 立替(割り勘 diff=-500) と 相手 1000 立替(割り勘 diff=+500) で相殺。
    const assignments: RateAssignment[] = [
      { id: 1, price: 1000, isMe: true, rateIndex: 5 },
      { id: 2, price: 1000, isMe: false, rateIndex: 5 }
    ];
    expect(totalSettlementDiff(summarizeByRate(assignments))).toBe(0);
    expect(resolveSettlement(assignments)).toEqual({
      needed: false,
      isPay: false,
      price: 0
    });
  });

  it('diff 合計が正なら「お渡し」（isPay=true・price=|diff|）', () => {
    // 相手が 2000 立替・割り勘 → 自分が 1000 払う（お渡し）。
    const result = resolveSettlement([
      { id: 1, price: 2000, isMe: false, rateIndex: 5 }
    ]);
    expect(result).toEqual({ needed: true, isPay: true, price: 1000 });
  });

  it('diff 合計が負なら「受け取り」（isPay=false・price=|diff|）', () => {
    // 自分が 2000 立替・割り勘 → 自分は 1000 受け取る。
    const result = resolveSettlement([
      { id: 1, price: 2000, isMe: true, rateIndex: 5 }
    ]);
    expect(result).toEqual({ needed: true, isPay: false, price: 1000 });
  });
});

describe('collectAssignedIds', () => {
  it('割当済み record の id を全て集める', () => {
    expect(
      collectAssignedIds([
        { id: 3, price: 1, isMe: true, rateIndex: 0 },
        { id: 7, price: 1, isMe: false, rateIndex: 5 }
      ])
    ).toEqual([3, 7]);
  });
});
