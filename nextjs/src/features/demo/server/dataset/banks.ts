import 'server-only';
import { colors } from './colors';
import { defineTable } from './table';
import { demoUsers } from './users';

// banks / bank_balances（口座と残高記録）。個人専用テーブル（pair で共有しない）。

export type DemoBank = {
  id: number;
  userUid: string;
  name: string;
  colorId: number;
};

export const [banks, bankRows] = defineTable({
  ordinary: {
    userUid: demoUsers.self.uid,
    name: '普通預金',
    colorId: colors.blue.id
  },
  securities: {
    userUid: demoUsers.self.uid,
    name: '証券口座',
    colorId: colors.green.id
  }
} satisfies Record<string, Omit<DemoBank, 'id'>>);

// 残高記録 1 行（bank_balances）。同じ createdAt の行が 1 回の登録操作 = 1 スナップショット。
export type DemoBankBalance = {
  id: number;
  bankId: number;
  price: number;
  createdAt: Date;
};

// 2026 年の月末残高（昇順）。JST 暦日がずれないよう正午 UTC=03:00 で固定。
const monthEndBalances: [date: string, ordinary: number, securities: number][] =
  [
    ['2026-01-31', 1200000, 800000],
    ['2026-02-28', 1250000, 850000],
    ['2026-03-31', 1310000, 870000],
    ['2026-04-30', 1290000, 910000],
    ['2026-05-31', 1350000, 930000],
    ['2026-06-30', 1400000, 950000],
    ['2026-07-31', 1420000, 1010000],
    ['2026-08-31', 1480000, 1040000]
  ];

export const bankBalanceRows: DemoBankBalance[] = monthEndBalances.flatMap(
  ([date, ordinary, securities], index) => {
    const createdAt = new Date(`${date}T03:00:00.000Z`);
    return [
      {
        id: index * 2 + 1,
        bankId: banks.ordinary.id,
        price: ordinary,
        createdAt
      },
      {
        id: index * 2 + 2,
        bankId: banks.securities.id,
        price: securities,
        createdAt
      }
    ];
  }
);
