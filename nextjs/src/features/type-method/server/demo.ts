import 'server-only';
import type { GroupedMethodList, GroupedTypeList } from '../types';

// デモ用モックデータ（デモログイン時に DB へ触れず返す）。
// withDemoRead に渡す。更新系は withDemoWriteVoid で no-op 成功にするため値は不要。

export const demoGroupedTypeList: GroupedTypeList = {
  income: {
    self: [
      {
        id: -1,
        name: '給与',
        colorClassificationId: 1,
        colorName: 'green',
        isPair: false,
        subTypes: []
      }
    ],
    pair: []
  },
  pay: {
    self: [
      {
        id: -2,
        name: '食費',
        colorClassificationId: 2,
        colorName: 'orange',
        isPair: false,
        subTypes: [
          { id: -10, name: '外食' },
          { id: -11, name: '食料品' }
        ]
      }
    ],
    pair: []
  }
};

export const demoGroupedMethodList: GroupedMethodList = {
  income: { self: [], pair: [] },
  pay: {
    self: [
      {
        id: -1,
        name: '現金',
        colorClassificationId: 3,
        colorName: 'blue',
        isPair: false
      }
    ],
    pair: []
  },
  both: { self: [], pair: [] }
};
