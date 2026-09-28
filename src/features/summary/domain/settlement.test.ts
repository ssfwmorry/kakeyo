import { describe, expect, it } from 'vitest';
import {
  collectAssignedIds,
  type RateAssignment,
  resolveSettlement,
  summarizeByRate,
  totalSettlementDiff
} from './settlement';

// rateIndex の意味: 0=10：0（自分が全額）、5=割り勘、10=0：10（相手が全額）。

describe('summarizeByRate', () => {
  it('割り勘: 自分が全額立て替えたら半額を受け取る（diff が負）', () => {
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

  it('割り勘: 相手が全額立て替えたら半額を渡す（diff が正）', () => {
    const [report] = summarizeByRate([
      { id: 1, price: 1000, isMe: false, rateIndex: 5 }
    ]);
    expect(report).toEqual({
      rateIndex: 5,
      sum: 1000,
      asIs: 0,
      toBe: 500,
      diff: 500
    });
  });

  it('自分が全額負担（rateIndex=0）: 相手の立替なら全額渡す', () => {
    const [report] = summarizeByRate([
      { id: 1, price: 800, isMe: false, rateIndex: 0 }
    ]);
    expect(report.toBe).toBe(800);
    expect(report.diff).toBe(800);
  });

  it('相手が全額負担（rateIndex=10）: 自分の立替なら全額受け取る', () => {
    const [report] = summarizeByRate([
      { id: 1, price: 800, isMe: true, rateIndex: 10 }
    ]);
    expect(report.toBe).toBe(0);
    expect(report.diff).toBe(-800);
  });

  it('端数は四捨五入する', () => {
    // 999 × 0.7 = 699.3 → 699。
    const [report] = summarizeByRate([
      { id: 1, price: 999, isMe: false, rateIndex: 3 }
    ]);
    expect(report.toBe).toBe(699);
  });

  it('同じ率の record は合算する', () => {
    const reports = summarizeByRate([
      { id: 1, price: 1000, isMe: true, rateIndex: 5 },
      { id: 2, price: 500, isMe: false, rateIndex: 5 }
    ]);
    expect(reports).toHaveLength(1);
    expect(reports[0]).toMatchObject({ sum: 1500, asIs: 1000, toBe: 750 });
  });

  it('複数の率は index 昇順で返す', () => {
    const reports = summarizeByRate([
      { id: 1, price: 100, isMe: true, rateIndex: 8 },
      { id: 2, price: 100, isMe: true, rateIndex: 2 }
    ]);
    expect(reports.map((report) => report.rateIndex)).toEqual([2, 8]);
  });

  it('範囲外の rateIndex は集計から除く', () => {
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
  it('差額の合計が 0 なら精算は要らない', () => {
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

  it('差額の合計が正なら自分が渡す', () => {
    expect(
      resolveSettlement([{ id: 1, price: 2000, isMe: false, rateIndex: 5 }])
    ).toEqual({ needed: true, isPay: true, price: 1000 });
  });

  it('差額の合計が負なら自分が受け取る', () => {
    expect(
      resolveSettlement([{ id: 1, price: 2000, isMe: true, rateIndex: 5 }])
    ).toEqual({ needed: true, isPay: false, price: 1000 });
  });

  it('率を混ぜても各グループの toBe − asIs の合計と一致する', () => {
    // 自分 4,800（割り勘）+ 相手 3,600（割り勘）+ 相手 8,900（自分が全額）+ 自分 2,160（相手が全額）。
    const assignments: RateAssignment[] = [
      { id: 1, price: 4800, isMe: true, rateIndex: 5 },
      { id: 2, price: 3600, isMe: false, rateIndex: 5 },
      { id: 3, price: 8900, isMe: false, rateIndex: 0 },
      { id: 4, price: 2160, isMe: true, rateIndex: 10 }
    ];
    const reports = summarizeByRate(assignments);
    const expected = reports.reduce((sum, r) => sum + (r.toBe - r.asIs), 0);
    // 割り勘: toBe 4,200 − asIs 4,800 = −600。全額: +8,900。相手全額: −2,160。
    expect(expected).toBe(6140);
    expect(resolveSettlement(assignments)).toEqual({
      needed: true,
      isPay: true,
      price: 6140
    });
  });
});

describe('collectAssignedIds', () => {
  it('割当済みの record の id を全て集める', () => {
    expect(
      collectAssignedIds([
        { id: 3, price: 1, isMe: true, rateIndex: 0 },
        { id: 7, price: 1, isMe: false, rateIndex: 5 }
      ])
    ).toEqual([3, 7]);
  });
});
