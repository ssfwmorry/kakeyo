import { describe, expect, it } from 'vitest';
import type {
  MethodSummaryItem,
  PayAndIncomeItem,
  SubTypeSummaryRow,
  TypeSummaryItem,
  TypeSummaryPeriodRow
} from '../types';
import {
  buildMethodPie,
  buildPayIncomeBar,
  buildSubTypeStack,
  buildTypePeriodStack,
  buildTypePie
} from './chart-data';

// summary 各グラフ整形の Vitest（純粋関数）。

const hex = (name: string | null) => (name === null ? '#ffeb3b' : `#${name}`);

describe('buildTypePie', () => {
  it('sum===0 を落とし、slices と list を作る（typeId=null は id=-1・＞不可）', () => {
    const items: TypeSummaryItem[] = [
      {
        typeId: 1,
        typeName: '食費',
        isPair: false,
        colorName: 'orange',
        sum: 100,
        subTypes: [{ subTypeId: 11, subTypeName: '外食', subTypeSum: 60 }]
      },
      {
        typeId: 2,
        typeName: 'ゼロ',
        isPair: false,
        colorName: 'blue',
        sum: 0,
        subTypes: []
      },
      {
        typeId: null,
        typeName: null,
        isPair: true,
        colorName: null,
        sum: 200,
        subTypes: []
      }
    ];
    const { slices, list } = buildTypePie(items, hex, 'yellow', '精算');
    expect(slices).toEqual([
      { name: '食費', value: 100, fill: '#orange' },
      { name: '精算', value: 200, fill: '#ffeb3b' }
    ]);
    expect(list[0]).toMatchObject({ id: 1, name: '食費', colorName: 'orange' });
    expect(list[0].subs).toEqual([{ id: 11, name: '外食', value: 60 }]);
    // typeId=null は id=-1（＞不可を呼び出し側が判定）、色は精算トークン。
    expect(list[1]).toMatchObject({
      id: -1,
      name: '精算',
      colorName: 'yellow'
    });
  });
});

describe('buildMethodPie', () => {
  it('sum===0 を落とす', () => {
    const items: MethodSummaryItem[] = [
      {
        methodId: 1,
        methodName: '現金',
        pairUserName: null,
        colorName: 'blue',
        isPair: false,
        sum: 300
      },
      {
        methodId: 2,
        methodName: 'ゼロ',
        pairUserName: null,
        colorName: 'red',
        isPair: false,
        sum: 0
      }
    ];
    const { slices, list } = buildMethodPie(items, hex);
    expect(slices).toHaveLength(1);
    expect(list[0]).toMatchObject({ id: 1, name: '現金', value: 300 });
  });
});

describe('buildPayIncomeBar', () => {
  it('12 ヶ月へ整形し欠損は 0・収支=income-pay・合計を出す', () => {
    const items: PayAndIncomeItem[] = [
      { yearMonth: '2026-01', paySum: 100, incomeSum: 300 },
      { yearMonth: '2026-03', paySum: 50, incomeSum: 0 }
    ];
    const { rows, sumPay, sumPayAndIncome } = buildPayIncomeBar(items, 2026);
    expect(rows).toHaveLength(12);
    expect(rows[0]).toEqual({
      month: '1',
      pay: 100,
      income: 300,
      payAndIncome: 200
    });
    expect(rows[1]).toEqual({ month: '2', pay: 0, income: 0, payAndIncome: 0 });
    expect(rows[2]).toEqual({
      month: '3',
      pay: 50,
      income: 0,
      payAndIncome: -50
    });
    expect(sumPay).toBe(150);
    expect(sumPayAndIncome).toBe(150); // 200 + 0 + (-50)
  });
});

describe('buildTypePeriodStack', () => {
  it('カテゴリを系列に、12 ヶ月へ整形（欠損 0）', () => {
    const rows: TypeSummaryPeriodRow[] = [
      {
        yearMonth: '2026-01',
        typeId: 1,
        typeName: '食費',
        typeColorClassificationName: 'orange',
        sum: 100
      },
      {
        yearMonth: '2026-02',
        typeId: 1,
        typeName: '食費',
        typeColorClassificationName: 'orange',
        sum: 80
      },
      {
        yearMonth: '2026-01',
        typeId: null,
        typeName: null,
        typeColorClassificationName: null,
        sum: 50
      }
    ];
    const { rows: bars, series } = buildTypePeriodStack(
      rows,
      2026,
      hex,
      '精算'
    );
    expect(series).toEqual([
      { key: '1', label: '食費', color: '#orange' },
      { key: 'null', label: '精算', color: '#ffeb3b' }
    ]);
    expect(bars).toHaveLength(12);
    expect(bars[0]).toEqual({ month: '1', '1': 100, null: 50 });
    expect(bars[1]).toEqual({ month: '2', '1': 80, null: 0 });
  });
});

describe('buildSubTypeStack', () => {
  it('「なし」系列を先頭に、他は循環パレット', () => {
    const rows: SubTypeSummaryRow[] = [
      { yearMonth: '2026-01', subTypeId: 11, sum: 60 },
      { yearMonth: '2026-01', subTypeId: null, sum: 40 },
      { yearMonth: '2026-02', subTypeId: 11, sum: 30 }
    ];
    const { rows: bars, series } = buildSubTypeStack(
      rows,
      2026,
      (id) => (id === null ? 'なし' : `sub${id}`),
      (i) => `p${i}`,
      '#grey',
      'サブカテゴリなし'
    );
    expect(series[0]).toEqual({
      key: 'null',
      label: 'サブカテゴリなし',
      color: '#grey'
    });
    expect(series[1]).toEqual({ key: '11', label: 'sub11', color: 'p0' });
    expect(bars[0]).toEqual({ month: '1', null: 40, '11': 60 });
    expect(bars[1]).toEqual({ month: '2', null: 0, '11': 30 });
  });
});
