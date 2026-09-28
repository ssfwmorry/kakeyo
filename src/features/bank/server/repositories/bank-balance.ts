import 'server-only';
import { prisma } from '@/lib/server/db/client';
import { buildOwnerScopeWhere } from '@/lib/shared/db/scope';
import type { SessionScope } from '@/lib/shared/types/auth';
import type { Id } from '@/lib/shared/types/id';

// bank_balances は user_id 列を持たない（price + created_at の履歴テーブル）。
// そのため所有者絞り込みは親 bank 経由で行う: where { bank: buildOwnerScopeWhere(scope) }。
// 個人専用（pair で共有しない）のため buildScopeWhere ではなく buildOwnerScopeWhere。

// 履歴の遡及期間（5 年）。
const HISTORY_YEARS = 5;

// 取得系の 1 行（整形前の生に近い形）。合計補完は domain/balance-table が行う。
export type BankBalanceRow = {
  id: Id;
  bankId: Id;
  price: number;
  createdAt: Date;
};

// 親 bank の所有者スコープで絞る。合計補完が前行依存のため created_at 昇順で返す。
export async function getBankBalanceList(
  scope: SessionScope
): Promise<BankBalanceRow[]> {
  const threshold = new Date();
  threshold.setFullYear(threshold.getFullYear() - HISTORY_YEARS);

  const rows = await prisma.bankBalance.findMany({
    where: {
      bank: buildOwnerScopeWhere(scope),
      createdAt: { gt: threshold }
    },
    select: { id: true, bankId: true, price: true, createdAt: true },
    orderBy: { createdAt: 'asc' }
  });
  return rows.map((row) => ({
    id: row.id,
    bankId: row.bankId,
    price: row.price,
    createdAt: row.createdAt
  }));
}

// 挿入前に、渡された bankId が全て自分の口座か検証する（他人の口座に残高を
// 差し込ませない）。検証対象の id だけを in で絞って count し、ユニークな
// bankId 数と一致すれば全て自分の口座（全所有口座を引かずに済む）。
export async function insertBankBalances(
  scope: SessionScope,
  rows: Array<{ bankId: Id; price: number }>
): Promise<{ ok: true } | { ok: false; error: 'notOwned' }> {
  const targetIds = [...new Set(rows.map((row) => row.bankId))];
  const ownedCount = await prisma.bank.count({
    where: { AND: [{ id: { in: targetIds } }, buildOwnerScopeWhere(scope)] }
  });
  if (ownedCount !== targetIds.length) {
    return { ok: false, error: 'notOwned' };
  }

  await prisma.bankBalance.createMany({
    data: rows.map((row) => ({ bankId: row.bankId, price: row.price }))
  });
  return { ok: true };
}
