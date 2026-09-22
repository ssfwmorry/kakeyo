import 'server-only';
import type { BankScreenData } from '../types';

// L7 bank のデモ用モックデータ（デモログイン時に DB へ触れず返す）。
// withDemoRead に渡す。更新系は withDemoWriteVoid で no-op 成功にするため値は不要。

export const demoBankScreenData: BankScreenData = {
  banks: [
    { id: -1, name: '普通預金', colorClassificationId: 6, colorName: 'blue' },
    { id: -2, name: '証券口座', colorClassificationId: 10, colorName: 'green' }
  ],
  tableRows: [
    {
      createdDate: '2026-01-31',
      bankPrices: [1200000, 800000],
      sum: 2000000
    },
    {
      createdDate: '2026-02-28',
      bankPrices: [1250000, 850000],
      sum: 2100000
    }
  ],
  chartPoints: [
    { date: '2026-01-31', '-1': 1200000, '-2': 800000 },
    { date: '2026-02-28', '-1': 1250000, '-2': 850000 }
  ]
};
