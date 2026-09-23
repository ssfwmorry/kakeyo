import 'server-only';
import { toDateStringJst } from '@/lib/shared/domain/date';
import { buildBalanceChart } from '../domain/balance-chart';
import {
  type BalanceSnapshot,
  buildBalanceTable
} from '../domain/balance-table';
import type { BankItem, BankScreenData } from '../types';

// bank のデモ用モックデータ。
// 残高テーブルとチャートは実処理と同じドメイン関数で月末スナップショットから組み立て、
// 表とグラフの値が食い違わないようにする。

const demoBanks: BankItem[] = [
  { id: 1, name: '普通預金', colorClassificationId: 6, colorName: 'blue' },
  { id: 2, name: '証券口座', colorClassificationId: 10, colorName: 'green' }
];

// 2026 年の月末残高（昇順）。JST 暦日がずれないよう正午 UTC=03:00 で固定。
const demoMonthEndBalances: [
  date: string,
  ordinary: number,
  securities: number
][] = [
  ['2026-01-31', 1200000, 800000],
  ['2026-02-28', 1250000, 850000],
  ['2026-03-31', 1310000, 870000],
  ['2026-04-30', 1290000, 910000],
  ['2026-05-31', 1350000, 930000],
  ['2026-06-30', 1400000, 950000],
  ['2026-07-31', 1420000, 1010000],
  ['2026-08-31', 1480000, 1040000]
];

const demoSnapshots: BalanceSnapshot[] = demoMonthEndBalances.map(
  ([date, ordinary, securities]) => ({
    createdAt: new Date(`${date}T03:00:00.000Z`),
    prices: { '1': ordinary, '2': securities }
  })
);

export const demoBankScreenData: BankScreenData = {
  banks: demoBanks,
  tableRows: buildBalanceTable(demoBanks, demoSnapshots),
  chartPoints: buildBalanceChart(demoBanks, demoSnapshots, toDateStringJst)
};
