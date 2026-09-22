import 'server-only';
import { withDemoRead, withDemoWriteVoid } from '@/features/auth/server/demo';
import { toYearMonthJst } from '@/lib/shared/domain/date';
import type { SessionData } from '@/lib/shared/types/auth';
import type { Id } from '@/lib/shared/types/id';
import { err, ok, type Result } from '@/lib/shared/types/result';
import { Prisma } from '@/prisma/generated/client';
import { resolveRecordOwnership } from '../domain/record-fields';
import type {
  PairedRecordItem,
  RecordError,
  RecordListItem,
  SummarizedRecordItem,
  SummarizedRecordQuery
} from '../types';
import {
  demoPairedRecordList,
  demoRecordList,
  demoSummarizedRecordList
} from './demo';
import * as recordRepo from './repositories/record';

// L2 record サービス層（server-only）。Server Action / Route から呼ぶ入口。
// 戻りは Result<T, RecordError>（UI 文言は持たない）。取得は withDemoRead、
// 更新は withDemoWriteVoid でデモ注入（デモは DB へ触れず成功扱い）。
// userUid / pairId は session から作りクライアント値を信用しない（scope 漏れ防止）。

// FK 制約違反（P2003）を foreignKey へ写す。それ以外は unknown。
function toDeleteError(error: unknown): RecordError {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2003'
  ) {
    return 'foreignKey';
  }
  return 'unknown';
}

// ============================================================
// READ
// ============================================================

// カレンダー用: 期間内 record。start/end は service に Date で渡される。
export async function getRecordListForRange(
  session: SessionData,
  start: Date,
  end: Date
): Promise<RecordListItem[]> {
  return withDemoRead(session.isDemo, demoRecordList, () =>
    recordRepo.getRecordList(session, start, end)
  );
}

// records 明細用: 条件検索 record。
export async function getSummarizedRecords(
  session: SessionData,
  query: SummarizedRecordQuery
): Promise<SummarizedRecordItem[]> {
  return withDemoRead(session.isDemo, demoSummarizedRecordList, () =>
    recordRepo.getSummarizedRecordList(session, query)
  );
}

// 精算画面用: ペアの record。ペア未設定なら空（個人に精算相手はいない）。
export async function getPairedRecords(
  session: SessionData,
  yearMonth: string
): Promise<PairedRecordItem[]> {
  return withDemoRead(session.isDemo, demoPairedRecordList, async () => {
    if (session.pairId === null) {
      return [];
    }
    return recordRepo.getPairedRecordList(session, yearMonth);
  });
}

// ============================================================
// CRUD
// ============================================================

type UpsertRecordInput = {
  id?: Id;
  datetime: Date;
  isPay: boolean;
  methodId: Id;
  isInstead: boolean;
  typeId: Id;
  subTypeId: Id | null;
  price: number;
  memo: string | null;
  // ペアモード（共有 ON/OFF）。session.pairId の有無とは別。
  isPair: boolean;
};

// 通常記録の登録・更新。record_type / user_id / pair_id / is_settled は
// resolveRecordOwnership に一元化して導出する（自前で 0/5/10/15 を書かない）。
export async function upsertRecord(
  session: SessionData,
  input: UpsertRecordInput
): Promise<Result<void, RecordError>> {
  // 共有記録には pairId 必須。クライアント値ではなく session の pairId を使う。
  if (input.isPair && session.pairId === null) {
    return err('pairRequired');
  }

  const ownership = resolveRecordOwnership({
    userUid: session.userUid,
    pairId: session.pairId,
    isPair: input.isPair,
    isInstead: input.isInstead
  });

  const fields: recordRepo.RecordUpsertInput = {
    userId: ownership.userId,
    pairId: ownership.pairId,
    datetime: input.datetime,
    isPay: input.isPay,
    methodId: input.methodId,
    typeId: input.typeId,
    subTypeId: input.subTypeId,
    price: input.price,
    memo: input.memo,
    isSettled: ownership.isSettled,
    recordType: ownership.recordType
  };

  return withDemoWriteVoid(session.isDemo, async () => {
    if (input.id === undefined) {
      await recordRepo.insertRecord(fields);
      return ok(undefined);
    }
    // 更新は対象が scope 内か検証（他ペアの行を触らせない）。
    const target = await recordRepo.findRecordInScope(session, input.id);
    if (!target) {
      return err('notInScope');
    }
    // 定期由来 record は同月内のみ変更可（旧 note の validateRecordAndShowErrorMsg）。
    if (
      target.plannedRecordId !== null &&
      toYearMonthJst(target.datetime) !== toYearMonthJst(input.datetime)
    ) {
      return err('sameMonthOnly');
    }
    await recordRepo.updateRecord(input.id, fields);
    return ok(undefined);
  });
}

type SettlementInput = {
  datetime: Date;
  // 支払（自分が相手へ送金）なら true、受取なら false。
  isPay: boolean;
  methodId: Id;
  price: number;
};

// 精算 record の作成。受取（!isPay）のときは相手を負担者にするため相手 user_id を引く。
export async function createSettlementRecord(
  session: SessionData,
  input: SettlementInput
): Promise<Result<void, RecordError>> {
  if (session.pairId === null) {
    return err('pairRequired');
  }
  const pairId = session.pairId;

  return withDemoWriteVoid(session.isDemo, async () => {
    // 支払は自分が負担者。受取は相手が負担者（相手を pairs から引く）。
    let userId = session.userUid;
    if (!input.isPay) {
      const counterpart = await recordRepo.findCounterpartUserId(
        session,
        pairId
      );
      if (!counterpart) {
        return err('notInScope');
      }
      userId = counterpart;
    }
    await recordRepo.insertSettlementRecord({
      userId,
      pairId,
      datetime: input.datetime,
      methodId: input.methodId,
      price: input.price
    });
    return ok(undefined);
  });
}

// 複数 record を精算済み（is_settled=true）に更新。対象は全て scope 内かつ立替(5)のみ。
export async function settleRecords(
  session: SessionData,
  ids: Id[]
): Promise<Result<void, RecordError>> {
  if (ids.length === 0) {
    return err('noTarget');
  }
  return withDemoWriteVoid(session.isDemo, async () => {
    // scope を where に AND した updateMany の件数が id 数と一致することで
    // 「全て自分/ペアの行」を保証する（他ペアの精算を書き換えさせない）。
    const uniqueIds = [...new Set(ids)];
    const updated = await recordRepo.markRecordsSettled(session, uniqueIds);
    if (updated !== uniqueIds.length) {
      return err('notInScope');
    }
    return ok(undefined);
  });
}

// record 削除。scope を where に AND した deleteMany で scope 保証を DB 条件に閉じ込める。
export async function deleteRecord(
  session: SessionData,
  id: Id
): Promise<Result<void, RecordError>> {
  return withDemoWriteVoid(session.isDemo, async () => {
    try {
      const result = await recordRepo.deleteRecordById(session, id);
      if (!result.ok) {
        return err('notInScope');
      }
      return ok(undefined);
    } catch (error) {
      return err(toDeleteError(error));
    }
  });
}
