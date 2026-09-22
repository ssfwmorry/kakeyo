'use server';

import { parseWithZod } from '@conform-to/zod/v4';
import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/features/auth/server/requireAuth';
import { startOfDayJst } from '@/lib/shared/domain/date';
import { L } from '@/lib/shared/labels';
import {
  type FormActionResult,
  toFormResult
} from '@/lib/shared/types/formResult';
import { recordLabels } from '../labels';
import {
  settlementCreateSchema,
  settleRecordsSchema
} from '../schemas/settlement-schema';
import * as service from '../server/services';
import type { RecordError } from '../types';

// 精算（summary/settlement 画面・L6）の Server Actions。record CRUD は L2 が所有する。
// 精算画面は遷移しないため FormActionResult.toast を使い、revalidatePath で再取得する。
// NOTE(レーン跨ぎ): /summary は L6 が実装する。ここでは revalidate 先を summary とする。
const SUMMARY_PATH = '/summary';

function errorMessage(error: RecordError): string | undefined {
  switch (error) {
    case 'pairRequired':
      return recordLabels.error.pairRequired;
    case 'notInScope':
      return L.error.notFound;
    case 'noTarget':
      return recordLabels.error.noTarget;
    default:
      return undefined;
  }
}

function toResult(
  result: Awaited<ReturnType<typeof service.createSettlementRecord>>,
  success: string
): FormActionResult {
  return toFormResult<void, RecordError>(result, {
    success,
    errorMessage,
    fallbackError: L.snackbar.failed
  });
}

// 精算 record の作成（支払/受取）。
export async function createSettlementRecordAction(
  _prev: FormActionResult | null,
  formData: FormData
): Promise<FormActionResult> {
  const submission = parseWithZod(formData, { schema: settlementCreateSchema });
  if (submission.status !== 'success') {
    return { submission: submission.reply() };
  }
  const session = await requireAuth();
  const { date, isPay, methodId, price } = submission.value;

  const result = await service.createSettlementRecord(session, {
    datetime: startOfDayJst(date),
    isPay,
    methodId,
    price
  });
  revalidatePath(SUMMARY_PATH);
  return {
    ...toResult(result, L.snackbar.created),
    submission: submission.reply()
  };
}

// 複数 record を精算済みに更新。ids は Conform の配列フィールド（string[]）で届く。
export async function settleRecordsAction(
  _prev: FormActionResult | null,
  formData: FormData
): Promise<FormActionResult> {
  const submission = parseWithZod(formData, { schema: settleRecordsSchema });
  if (submission.status !== 'success') {
    return { submission: submission.reply() };
  }
  const session = await requireAuth();
  const result = await service.settleRecords(session, submission.value.ids);
  revalidatePath(SUMMARY_PATH);
  return {
    ...toResult(result, L.snackbar.updated),
    submission: submission.reply()
  };
}
