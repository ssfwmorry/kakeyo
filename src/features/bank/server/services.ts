import 'server-only';
import { withDemoRead, withDemoWriteVoid } from '@/features/demo/server/inject';
import * as demoBank from '@/features/demo/server/queries/bank';
import { toDateStringJst } from '@/lib/shared/domain/date';
import type { SessionData } from '@/lib/shared/types/auth';
import type { Id } from '@/lib/shared/types/id';
import { err, ok, type Result } from '@/lib/shared/types/result';
import { buildBalanceChart } from '../domain/balance-chart';
import { buildBalanceTable, toBalanceSnapshots } from '../domain/balance-table';
import type { BankError, BankItem, BankScreenData } from '../types';
import * as bankRepo from './repositories/bank';
import * as balanceRepo from './repositories/bank-balance';

// 口座一覧・残高テーブル・チャート点列をまとめて返す。
export async function getBankScreenData(
  session: SessionData
): Promise<BankScreenData> {
  return withDemoRead(
    session,
    () => demoBank.getBankScreenData(session),
    async () => {
      const [banks, balanceRows] = await Promise.all([
        bankRepo.getBankList(session),
        balanceRepo.getBankBalanceList(session)
      ]);
      const snapshots = toBalanceSnapshots(balanceRows);
      return {
        banks,
        tableRows: buildBalanceTable(banks, snapshots),
        chartPoints: buildBalanceChart(banks, snapshots, toDateStringJst)
      };
    }
  );
}

// 口座一覧のみ（設定タブ用）。
export async function getBankList(session: SessionData): Promise<BankItem[]> {
  return withDemoRead(
    session,
    () => demoBank.getBankList(session),
    () => bankRepo.getBankList(session)
  );
}

export async function upsertBank(
  session: SessionData,
  input: { id?: Id; name: string; colorId: Id }
): Promise<Result<void, BankError>> {
  return withDemoWriteVoid(session, async () => {
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
  return withDemoWriteVoid(session, async () => {
    const result = await bankRepo.deleteBank(session, id);
    if (!result.ok) {
      return err<BankError>(result.error);
    }
    return ok(undefined);
  });
}

export async function postBankBalances(
  session: SessionData,
  rows: Array<{ bankId: Id; price: number }>
): Promise<Result<void, BankError>> {
  return withDemoWriteVoid(session, async () => {
    const result = await balanceRepo.insertBankBalances(session, rows);
    if (!result.ok) {
      return err<BankError>(result.error);
    }
    return ok(undefined);
  });
}
