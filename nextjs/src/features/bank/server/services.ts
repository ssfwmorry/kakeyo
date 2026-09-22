import 'server-only';
import { withDemoRead, withDemoWriteVoid } from '@/features/auth/server/demo';
import { toDateStringJst } from '@/lib/shared/domain/date';
import type { SessionData } from '@/lib/shared/types/auth';
import type { Id } from '@/lib/shared/types/id';
import { err, ok, type Result } from '@/lib/shared/types/result';
import { buildBalanceChart } from '../domain/balance-chart';
import {
  type BalanceSnapshot,
  buildBalanceTable
} from '../domain/balance-table';
import type { BankError, BankItem, BankScreenData } from '../types';
import { demoBankScreenData } from './demo';
import * as bankRepo from './repositories/bank';
import type { BankBalanceRow } from './repositories/bank-balance';
import * as balanceRepo from './repositories/bank-balance';

// L7 bank サービス層。Result<T, BankError> を返す（UI 文言は持たない）。
// 取得は withDemoRead、更新は withDemoWriteVoid でデモ注入。
// userId は session（scope）から確定し、クライアント値を信用しない。

// created_at ごとに残高行を 1 スナップショットへ集約する（合計補完の入力形）。
// 昇順で渡された行をそのまま走査し、同一 JST 日付をまとめる。
function toSnapshots(rows: BankBalanceRow[]): BalanceSnapshot[] {
  // Map は挿入順を保持するため、rows（created_at 昇順）の登場順がそのまま維持される。
  const byDate = new Map<string, BalanceSnapshot>();
  for (const row of rows) {
    // グループ化キーは元の created_at（同一 timestamp が同じ登録操作）。
    const key = row.createdAt.toISOString();
    const existing = byDate.get(key);
    if (existing) {
      existing.prices[String(row.bankId)] = row.price;
      continue;
    }
    byDate.set(key, {
      createdAt: row.createdAt,
      prices: { [String(row.bankId)]: row.price }
    });
  }
  return [...byDate.values()];
}

// ===== READ（画面用一括取得） =====
// 口座一覧・残高テーブル・チャート点列をまとめて返す。
export async function getBankScreenData(
  session: SessionData
): Promise<BankScreenData> {
  return withDemoRead(session.isDemo, demoBankScreenData, async () => {
    const [banks, balanceRows] = await Promise.all([
      bankRepo.getBankList(session),
      balanceRepo.getBankBalanceList(session)
    ]);
    const snapshots = toSnapshots(balanceRows);
    return {
      banks,
      tableRows: buildBalanceTable(banks, snapshots),
      chartPoints: buildBalanceChart(banks, snapshots, toDateStringJst)
    };
  });
}

// 口座一覧のみ（設定タブ用）。
export async function getBankList(session: SessionData): Promise<BankItem[]> {
  return withDemoRead(session.isDemo, demoBankScreenData.banks, () =>
    bankRepo.getBankList(session)
  );
}

// ===== BANK CRUD =====
export async function upsertBank(
  session: SessionData,
  input: { id?: Id; name: string; colorId: Id }
): Promise<Result<void, BankError>> {
  return withDemoWriteVoid(session.isDemo, async () => {
    if (input.id === undefined) {
      await bankRepo.insertBank(session, {
        name: input.name,
        colorClassificationId: input.colorId
      });
      return ok(undefined);
    }
    const result = await bankRepo.updateBank(session, {
      id: input.id,
      name: input.name,
      colorClassificationId: input.colorId
    });
    if (!result.ok) {
      return err<BankError>(result.error);
    }
    return ok(undefined);
  });
}

export async function deleteBank(
  session: SessionData,
  id: Id
): Promise<Result<void, BankError>> {
  return withDemoWriteVoid(session.isDemo, async () => {
    const result = await bankRepo.deleteBank(session, id);
    if (!result.ok) {
      return err<BankError>(result.error);
    }
    return ok(undefined);
  });
}

// ===== BANK BALANCE =====
export async function postBankBalances(
  session: SessionData,
  rows: Array<{ bankId: Id; price: number }>
): Promise<Result<void, BankError>> {
  return withDemoWriteVoid(session.isDemo, async () => {
    const result = await balanceRepo.insertBankBalances(session, rows);
    if (!result.ok) {
      return err<BankError>(result.error);
    }
    return ok(undefined);
  });
}
