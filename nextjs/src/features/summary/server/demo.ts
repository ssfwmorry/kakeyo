import 'server-only';
import { demoMaster } from '@/features/type-method/server/demo';
import type {
  MethodSummaryItem,
  PayAndIncomeItem,
  SubTypeSummaryRow,
  TypeChipsByQuadrant,
  TypeSummaryItem,
  TypeSummaryPeriodRow
} from '../types';

// summary のデモ用モックデータ。
// id・名前・色は type-method の demoMaster から取る。
// 集計値は月別テーブル（demoMonthly）から算出し、値を手書きしない。
// 2026-09 の行は record の demo.ts の明細（支出 108,780 / 収入 250,000）と一致する。
// 各取得はクエリ（年月・isPay・isPair）に関わらず同じ値を返す。

const { type, subType, method } = demoMaster;

// 月ごとに変動する支出（食費の内訳と日用品）。交通費 12,000 / 住居 80,000 / 収入 250,000 は固定。
const FIXED = { transport: 12000, housing: 80000, income: 250000 } as const;

type DemoMonth = {
  yearMonth: string;
  eatOut: number;
  grocery: number;
  daily: number;
};

const demoMonthly: DemoMonth[] = [
  { yearMonth: '2026-01', eatOut: 6400, grocery: 11000, daily: 3000 },
  { yearMonth: '2026-02', eatOut: 1800, grocery: 3300, daily: 1600 },
  { yearMonth: '2026-03', eatOut: 9800, grocery: 15000, daily: 4500 },
  { yearMonth: '2026-04', eatOut: 4100, grocery: 8000, daily: 1800 },
  { yearMonth: '2026-05', eatOut: 8900, grocery: 13000, daily: 3300 },
  { yearMonth: '2026-06', eatOut: 2300, grocery: 4000, daily: 1500 },
  { yearMonth: '2026-07', eatOut: 12200, grocery: 18000, daily: 4300 },
  { yearMonth: '2026-08', eatOut: 5900, grocery: 10000, daily: 2400 },
  // record の demo.ts（2026-09）と同値。
  { yearMonth: '2026-09', eatOut: 5280, grocery: 10000, daily: 1500 }
];

function foodSum(month: DemoMonth): number {
  return month.eatOut + month.grocery;
}

function paySum(month: DemoMonth): number {
  return foodSum(month) + month.daily + FIXED.transport + FIXED.housing;
}

// 内訳（カテゴリ別）は当月（2026-09）の値。
const current = demoMonthly[demoMonthly.length - 1];

export const demoTypeSummary: TypeSummaryItem[] = [
  {
    typeId: type.food.id,
    typeName: type.food.name,
    isPair: false,
    colorName: type.food.colorName,
    sum: foodSum(current),
    subTypes: [
      {
        subTypeId: subType.eatOut.id,
        subTypeName: subType.eatOut.name,
        subTypeSum: current.eatOut
      },
      {
        subTypeId: subType.grocery.id,
        subTypeName: subType.grocery.name,
        subTypeSum: current.grocery
      }
    ]
  },
  {
    typeId: type.daily.id,
    typeName: type.daily.name,
    isPair: false,
    colorName: type.daily.colorName,
    sum: current.daily,
    subTypes: []
  },
  {
    typeId: type.transport.id,
    typeName: type.transport.name,
    isPair: false,
    colorName: type.transport.colorName,
    sum: FIXED.transport,
    subTypes: []
  },
  {
    typeId: type.housing.id,
    typeName: type.housing.name,
    isPair: false,
    colorName: type.housing.colorName,
    sum: FIXED.housing,
    subTypes: []
  }
];

// 内訳（方法別）は当月（2026-09）の record 明細を方法別に足した値。
function methodSummary(
  item: (typeof method)[keyof typeof method],
  sum: number
): MethodSummaryItem {
  return {
    methodId: item.id,
    methodName: item.name,
    pairUserName: null,
    colorName: item.colorName,
    isPair: false,
    sum
  };
}
export const demoMethodSummary: MethodSummaryItem[] = [
  methodSummary(method.cash, 3180),
  methodSummary(method.credit, 25600),
  methodSummary(method.debit, FIXED.housing)
];

// 推移 > 全体（2026 年の月別 支出/収入）。
export const demoPayAndIncome: PayAndIncomeItem[] = demoMonthly.map(
  (month) => ({
    yearMonth: month.yearMonth,
    paySum: paySum(month),
    incomeSum: FIXED.income
  })
);

// 推移 > カテゴリ別（2026 年の月 × カテゴリ）。各月の合計は demoPayAndIncome.paySum と一致する。
export const demoTypeSummaryPeriod: TypeSummaryPeriodRow[] =
  demoMonthly.flatMap((month) =>
    [
      {
        typeId: type.food.id,
        typeName: type.food.name,
        typeColorClassificationName: type.food.colorName,
        sum: foodSum(month)
      },
      {
        typeId: type.daily.id,
        typeName: type.daily.name,
        typeColorClassificationName: type.daily.colorName,
        sum: month.daily
      },
      {
        typeId: type.transport.id,
        typeName: type.transport.name,
        typeColorClassificationName: type.transport.colorName,
        sum: FIXED.transport
      },
      {
        typeId: type.housing.id,
        typeName: type.housing.name,
        typeColorClassificationName: type.housing.colorName,
        sum: FIXED.housing
      }
    ].map((row) => ({ yearMonth: month.yearMonth, ...row }))
  );

// 推移 > カテゴリ別（特定カテゴリ選択時）。選択カテゴリに関わらず食費のサブカテゴリ内訳を返す。
export const demoSubTypeSummary: SubTypeSummaryRow[] = demoMonthly.flatMap(
  (month) => [
    {
      yearMonth: month.yearMonth,
      subTypeId: subType.eatOut.id,
      sum: month.eatOut
    },
    {
      yearMonth: month.yearMonth,
      subTypeId: subType.grocery.id,
      sum: month.grocery
    }
  ]
);

export const demoTypeChips: TypeChipsByQuadrant = {
  pay: {
    self: [
      {
        typeId: type.food.id,
        name: type.food.name,
        colorName: type.food.colorName
      },
      {
        typeId: type.daily.id,
        name: type.daily.name,
        colorName: type.daily.colorName
      },
      {
        typeId: type.transport.id,
        name: type.transport.name,
        colorName: type.transport.colorName
      },
      {
        typeId: type.housing.id,
        name: type.housing.name,
        colorName: type.housing.colorName
      }
    ],
    pair: []
  },
  income: {
    self: [
      {
        typeId: type.salary.id,
        name: type.salary.name,
        colorName: type.salary.colorName
      }
    ],
    pair: []
  }
};
