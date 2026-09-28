import 'server-only';
import { buildBalanceChart } from '@/features/bank/domain/balance-chart';
import {
  buildBalanceTable,
  toBalanceSnapshots
} from '@/features/bank/domain/balance-table';
import type { BankItem, BankScreenData } from '@/features/bank/types';
import { toDateStringJst } from '@/lib/shared/domain/date';
import type { SessionScope } from '@/lib/shared/types/auth';
import { bankBalanceRows, bankRows } from '../dataset/banks';
import { colorName } from '../dataset/colors';
import { ownedBy } from '../dataset/scope';

// bank のデモ射影。残高テーブルとチャートは実処理と同じドメイン関数で組み立て、
// 表とグラフの値が食い違わないようにする。

// getBankList 相当（個人専用テーブル）。
export function getBankList(scope: SessionScope): BankItem[] {
  return ownedBy(scope, bankRows).map((row) => ({
    id: row.id,
    name: row.name,
    colorClassificationId: row.colorId,
    colorName: colorName(row.colorId),
    hasBalance: bankBalanceRows.some((balance) => balance.bankId === row.id)
  }));
}

export function getBankScreenData(scope: SessionScope): BankScreenData {
  const banks = getBankList(scope);
  const bankIds = new Set(banks.map((bank) => bank.id));
  // getBankBalanceList 相当: 親 bank の所有者で絞る（created_at 昇順）。
  const snapshots = toBalanceSnapshots(
    bankBalanceRows.filter((row) => bankIds.has(row.bankId))
  );
  return {
    banks,
    tableRows: buildBalanceTable(banks, snapshots),
    chartPoints: buildBalanceChart(banks, snapshots, toDateStringJst)
  };
}
