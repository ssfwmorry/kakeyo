import 'server-only';
import { and, asc, eq, gt, inArray, sql } from 'drizzle-orm';
import { db } from '@/lib/server/db/client';
import { bankBalances, banks } from '@/lib/server/db/schema';
import { buildOwnerScopeWhere } from '@/lib/shared/db/scope';
import type { SessionScope } from '@/lib/shared/types/auth';
import type { Id } from '@/lib/shared/types/id';
import { MAX_HISTORY_YEARS } from '../../domain/history-range';

// bank_balances は user_id 列を持たない（price + created_at の履歴テーブル）。
// そのため所有者絞り込みは親 bank を join して行う。
// 個人専用（pair で共有しない）のため buildScopeWhere ではなく buildOwnerScopeWhere。

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
  threshold.setFullYear(threshold.getFullYear() - MAX_HISTORY_YEARS);

  const rows = await db
    .select({
      id: bankBalances.id,
      bankId: bankBalances.bankId,
      price: bankBalances.price,
      createdAt: bankBalances.createdAt
    })
    .from(bankBalances)
    .innerJoin(banks, eq(bankBalances.bankId, banks.id))
    .where(
      and(
        buildOwnerScopeWhere(banks.userId, scope),
        gt(bankBalances.createdAt, threshold)
      )
    )
    .orderBy(asc(bankBalances.createdAt));
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
  const [owned] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(banks)
    .where(
      and(
        inArray(banks.id, targetIds),
        buildOwnerScopeWhere(banks.userId, scope)
      )
    );
  if (owned.count !== targetIds.length) {
    return { ok: false, error: 'notOwned' };
  }

  await db
    .insert(bankBalances)
    .values(rows.map((row) => ({ bankId: row.bankId, price: row.price })));
  return { ok: true };
}
