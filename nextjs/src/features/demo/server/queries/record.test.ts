import { describe, expect, it } from 'vitest';
import { toYearMonthJst } from '@/lib/shared/domain/date';
import type { SessionScope } from '@/lib/shared/types/auth';
import { RecordType } from '@/lib/shared/types/recordType';
import { CURRENT_YEAR_MONTH } from '../dataset/records';
import { demoPair, demoUsers } from '../dataset/users';
import {
  getPairedRecords,
  getSummarizedRecords,
  visibleRecordViews
} from './record';
import { getPayAndIncomeList, getTypeSummary } from './summary';

// デモ record 群（単一の正）と、それを集計する summary 射影の整合を固定する。
// 画面で最も目立つ「内訳の合計 ≠ 明細の合計」「solo デモに共有 record が混ざる」を検知する。

const solo: SessionScope = { userUid: demoUsers.self.uid, pairId: null };
const pair: SessionScope = { userUid: demoUsers.self.uid, pairId: demoPair.id };

function sumOf(rows: { price: number }[]): number {
  return rows.reduce((total, row) => total + row.price, 0);
}

describe('demo record views', () => {
  it('id は全体で一意で、solo は個人 record のみ', () => {
    const ids = visibleRecordViews(pair).map((view) => view.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(visibleRecordViews(solo).every((view) => !view.isPair)).toBe(true);
  });

  it('pair でも相手の純個人 record は見えない', () => {
    expect(
      visibleRecordViews(pair).every(
        (view) => view.isPair || view.userUid === demoUsers.self.uid
      )
    ).toBe(true);
  });

  it('2026-09 の個人 record は支出 108,780 / 収入 250,000', () => {
    const views = visibleRecordViews(solo).filter(
      (view) => toYearMonthJst(view.datetime) === '2026-09'
    );
    expect(sumOf(views.filter((view) => view.isPay === true))).toBe(108780);
    expect(sumOf(views.filter((view) => view.isPay === false))).toBe(250000);
  });

  it('精算 record は過去月のみ、今月の立替は未精算', () => {
    const settlements = visibleRecordViews(pair).filter(
      (view) => view.recordType === RecordType.settlement
    );
    expect(settlements.length).toBeGreaterThan(0);
    expect(
      settlements.every((view) => view.yearMonth !== CURRENT_YEAR_MONTH)
    ).toBe(true);
    const currentInstead = getPairedRecords(pair, CURRENT_YEAR_MONTH).filter(
      (row) => row.isInstead
    );
    expect(currentInstead.map((row) => row.isSettled)).toEqual([false, false]);
    expect(getPairedRecords(solo, CURRENT_YEAR_MONTH)).toEqual([]);
  });
});

describe('summary 射影と records 明細の整合', () => {
  const cases = [
    { scope: solo, isPair: false, isIncludeInstead: false },
    { scope: pair, isPair: false, isIncludeInstead: false },
    { scope: pair, isPair: false, isIncludeInstead: true },
    { scope: pair, isPair: true, isIncludeInstead: false }
  ];

  for (const { scope, isPair, isIncludeInstead } of cases) {
    it(`pairId=${scope.pairId} isPair=${isPair} include=${isIncludeInstead}: 内訳の各カテゴリ合計 = 明細合計`, () => {
      const query = {
        isPay: true,
        isPair,
        isIncludeInstead,
        yearMonth: CURRENT_YEAR_MONTH
      };
      const items = getTypeSummary(scope, query);
      expect(items.length).toBeGreaterThan(0);
      for (const item of items) {
        if (item.typeId === null) {
          continue;
        }
        // ペアモードの集計 SQL は isIncludeInstead に関わらず立替(5)を含むため、明細側は立替込みで引く。
        const detail = getSummarizedRecords(scope, {
          ...query,
          isIncludeInstead: isPair || isIncludeInstead,
          isType: true,
          id: item.typeId,
          subTypeId: null
        });
        expect(sumOf(detail)).toBe(item.sum);
      }
    });
  }

  it('推移 > 全体の今月支出 = 内訳の合計', () => {
    const query = {
      isPay: true,
      isPair: true,
      isIncludeInstead: false,
      yearMonth: CURRENT_YEAR_MONTH
    };
    const pie = sumOf(
      getTypeSummary(pair, query).map((item) => ({ price: item.sum }))
    );
    const bar = getPayAndIncomeList(pair, {
      year: 2026,
      isPair: true,
      isIncludeInstead: false
    }).find((row) => row.yearMonth === CURRENT_YEAR_MONTH);
    expect(bar?.paySum).toBe(pie);
  });
});
