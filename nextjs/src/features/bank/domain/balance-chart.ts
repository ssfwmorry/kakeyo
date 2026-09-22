import type { BalanceChartPoint, BankItem } from '../types';
import type { BalanceSnapshot } from './balance-table';

// 残高チャート整形（純粋関数・FE/BE 両用）。
// 旧 Nuxt の getChartData は「登録がある日だけ点を打つ」だったが、Recharts の
// 積み上げ Area は全系列が各 x で値を持つ前提のため、テーブルと同じ前行引き継ぎで
// 各日の全口座値を埋めた点列に整形する（欠損日は前回値を維持、初回欠損は 0）。

// snapshots は created_at 昇順・日付グループ化済みで渡す（前行引き継ぎのため）。
export function buildBalanceChart(
  banks: BankItem[],
  snapshots: BalanceSnapshot[],
  toDateString: (value: Date | string) => string
): BalanceChartPoint[] {
  // 各口座の「直近の値」を保持しながら日付順に埋めていく。
  const latest = new Map<number, number>();
  return snapshots.map((snapshot) => {
    const point: BalanceChartPoint = {
      date: toDateString(snapshot.createdAt)
    };
    banks.forEach((bank) => {
      const key = String(bank.id);
      if (key in snapshot.prices) {
        latest.set(bank.id, snapshot.prices[key]);
      }
      // 未登録日は直近値を維持（無ければ 0 で積み上げに寄与しない）。
      point[key] = latest.get(bank.id) ?? 0;
    });
    return point;
  });
}
