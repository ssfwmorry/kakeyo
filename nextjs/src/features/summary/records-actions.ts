'use server';

import { requireAuth } from '@/features/auth/server/requireAuth';
import type { SummarizedRecordItem } from '@/features/record';
import { getSummarizedRecords } from '@/features/record/server/services';
import type { RecordsQuery } from './records-query';

// records 明細画面の月移動用データ取得 Server Action（取得のみ）。
// 既存の record サービス getSummarizedRecords をそのまま使う（L6 は取得系を再利用）。
// session は requireAuth() から取り、クライアント値を信用しない。
export async function fetchSummarizedRecordsAction(
  query: RecordsQuery
): Promise<SummarizedRecordItem[]> {
  const session = await requireAuth();
  return getSummarizedRecords(session, {
    isPay: query.isPay,
    isType: query.isType,
    isPair: query.isPair,
    isIncludeInstead: query.isIncludeInstead,
    yearMonth: query.yearMonth,
    id: query.id,
    subTypeId: query.subTypeId
  });
}
