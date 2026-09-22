import 'server-only';
import type {
  MethodSummaryItem,
  PayAndIncomeItem,
  SubTypeSummaryRow,
  TypeChip,
  TypeSummaryItem,
  TypeSummaryPeriodRow
} from '../types';

// L6 summary のデモ用モックデータ（デモログイン時に DB へ触れず返す）。
// withDemoRead に渡す。id は負値でダミー（実データと衝突しない number）。

export const demoTypeSummary: TypeSummaryItem[] = [
  {
    typeId: -1,
    typeName: '食費',
    isPair: false,
    colorName: 'orange',
    sum: 42000,
    subTypes: [
      { subTypeId: -11, subTypeName: '外食', subTypeSum: 18000 },
      { subTypeId: -12, subTypeName: '食料品', subTypeSum: 24000 }
    ]
  },
  {
    typeId: -2,
    typeName: '日用品',
    isPair: false,
    colorName: 'green',
    sum: 12000,
    subTypes: []
  },
  {
    typeId: -3,
    typeName: '交通費',
    isPair: false,
    colorName: 'blue',
    sum: 8000,
    subTypes: []
  }
];

export const demoMethodSummary: MethodSummaryItem[] = [
  {
    methodId: -1,
    methodName: '現金',
    pairUserName: null,
    colorName: 'blue',
    isPair: false,
    sum: 30000
  },
  {
    methodId: -2,
    methodName: 'クレジット',
    pairUserName: null,
    colorName: 'indigo',
    isPair: false,
    sum: 32000
  }
];

export const demoPayAndIncome: PayAndIncomeItem[] = [
  { yearMonth: '2026-01', paySum: 62000, incomeSum: 200000 },
  { yearMonth: '2026-02', paySum: 58000, incomeSum: 200000 },
  { yearMonth: '2026-03', paySum: 71000, incomeSum: 210000 }
];

export const demoTypeSummaryPeriod: TypeSummaryPeriodRow[] = [
  {
    yearMonth: '2026-01',
    typeId: -1,
    typeName: '食費',
    typeColorClassificationName: 'orange',
    sum: 42000
  },
  {
    yearMonth: '2026-01',
    typeId: -2,
    typeName: '日用品',
    typeColorClassificationName: 'green',
    sum: 12000
  },
  {
    yearMonth: '2026-02',
    typeId: -1,
    typeName: '食費',
    typeColorClassificationName: 'orange',
    sum: 38000
  },
  {
    yearMonth: '2026-02',
    typeId: -2,
    typeName: '日用品',
    typeColorClassificationName: 'green',
    sum: 15000
  }
];

export const demoSubTypeSummary: SubTypeSummaryRow[] = [
  { yearMonth: '2026-01', subTypeId: -11, sum: 18000 },
  { yearMonth: '2026-01', subTypeId: -12, sum: 24000 },
  { yearMonth: '2026-02', subTypeId: -11, sum: 16000 },
  { yearMonth: '2026-02', subTypeId: null, sum: 5000 }
];

export const demoTypeChips: {
  pay: { self: TypeChip[]; pair: TypeChip[] };
  income: { self: TypeChip[]; pair: TypeChip[] };
} = {
  pay: {
    self: [
      { typeId: -1, name: '食費', colorName: 'orange' },
      { typeId: -2, name: '日用品', colorName: 'green' },
      { typeId: -3, name: '交通費', colorName: 'blue' }
    ],
    pair: []
  },
  income: {
    self: [{ typeId: -4, name: '給与', colorName: 'teal' }],
    pair: []
  }
};
