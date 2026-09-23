import 'server-only';
import type { GroupedMethodList, GroupedTypeList } from '../types';

// type-method のデモ用モックデータ。
// record / summary / planned-record / memo-shortcut のモックは demoMaster の id・名前・色を
// 参照する（record / summary は import、planned-record / memo-shortcut は同値を手書き）。
// colorClassificationId と colorName は color_classifications マスタの対応どおり。

export const demoMaster = {
  type: {
    food: {
      id: 1,
      name: '食費',
      colorClassificationId: 14,
      colorName: 'orange'
    },
    daily: {
      id: 2,
      name: '日用品',
      colorClassificationId: 10,
      colorName: 'green'
    },
    transport: {
      id: 3,
      name: '交通費',
      colorClassificationId: 6,
      colorName: 'blue'
    },
    housing: {
      id: 4,
      name: '住居',
      colorClassificationId: 15,
      colorName: 'brown'
    },
    salary: { id: 5, name: '給与', colorClassificationId: 9, colorName: 'teal' }
  },
  subType: {
    eatOut: { id: 1, name: '外食' },
    grocery: { id: 2, name: '食料品' }
  },
  method: {
    cash: { id: 1, name: '現金', colorClassificationId: 6, colorName: 'blue' },
    credit: {
      id: 2,
      name: 'クレジット',
      colorClassificationId: 5,
      colorName: 'indigo'
    },
    debit: {
      id: 3,
      name: '銀行引落',
      colorClassificationId: 16,
      colorName: 'blue-grey'
    },
    transfer: {
      id: 4,
      name: '銀行振込',
      colorClassificationId: 9,
      colorName: 'teal'
    }
  }
} as const;

const { type, subType, method } = demoMaster;

export const demoGroupedTypeList: GroupedTypeList = {
  income: {
    self: [{ ...type.salary, isPair: false, subTypes: [] }],
    pair: []
  },
  pay: {
    self: [
      {
        ...type.food,
        isPair: false,
        subTypes: [subType.eatOut, subType.grocery]
      },
      { ...type.daily, isPair: false, subTypes: [] },
      { ...type.transport, isPair: false, subTypes: [] },
      { ...type.housing, isPair: false, subTypes: [] }
    ],
    pair: []
  }
};

export const demoGroupedMethodList: GroupedMethodList = {
  income: {
    self: [{ ...method.transfer, isPair: false }],
    pair: []
  },
  pay: {
    self: [
      { ...method.cash, isPair: false },
      { ...method.credit, isPair: false },
      { ...method.debit, isPair: false }
    ],
    pair: []
  },
  both: { self: [], pair: [] }
};
