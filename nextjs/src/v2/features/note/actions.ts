'use server';

import { parseWithZod } from '@conform-to/zod/v4';
import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/features/auth/server/requireAuth';
import { recordErrorMessage } from '@/features/record/domain/error-message';
import {
  recordDeleteSchema,
  recordUpsertSchema
} from '@/features/record/schemas/record-schema';
import { deleteRecord, upsertRecord } from '@/features/record/server/services';
import { getPairMode } from '@/lib/server/pair/mode';
import { startOfDayJst } from '@/lib/shared/domain/date';
import { L } from '@/lib/shared/labels';
import {
  type FormActionResult,
  toFormResult
} from '@/lib/shared/types/formResult';

// 記録シート（新デザイン）の登録・更新・削除。スキーマとサービスは旧 /note と同じ。
//
// 旧 /note は保存後に /calendar へ遷移するため flash 通知だったが、新デザインは
// カレンダーの上に出るシートで、保存してもカレンダーに留まる。そのため遷移せず
// FormActionResult.toast を返し、シートを閉じた側で月を取り直す（予定シートと同じ）。

const V2_CALENDAR_PATH = '/v2/calendar';

export async function upsertRecordAction(
  _prev: FormActionResult | null,
  formData: FormData
): Promise<FormActionResult> {
  const submission = parseWithZod(formData, { schema: recordUpsertSchema });
  if (submission.status !== 'success') {
    return { submission: submission.reply() };
  }
  const session = await requireAuth();
  // ペアモードは Cookie の単一の正から読む（フォーム値を信用しない）。
  const isPair = await getPairMode();

  const {
    id,
    date,
    isPay,
    isInstead,
    methodId,
    typeId,
    subTypeId,
    price,
    memo
  } = submission.value;

  const result = await upsertRecord(session, {
    id,
    datetime: startOfDayJst(date),
    isPay,
    isInstead,
    methodId,
    typeId,
    subTypeId: subTypeId ?? null,
    price,
    memo,
    isPair
  });
  revalidatePath(V2_CALENDAR_PATH);
  return toFormResult(result, {
    success: id === undefined ? L.snackbar.created : L.snackbar.updated,
    errorMessage: recordErrorMessage,
    fallbackError: L.snackbar.failed,
    submission: submission.reply()
  });
}

export async function deleteRecordAction(
  _prev: FormActionResult | null,
  formData: FormData
): Promise<FormActionResult> {
  const submission = parseWithZod(formData, { schema: recordDeleteSchema });
  if (submission.status !== 'success') {
    return { submission: submission.reply() };
  }
  const session = await requireAuth();
  const result = await deleteRecord(session, submission.value.id);
  revalidatePath(V2_CALENDAR_PATH);
  return toFormResult(result, {
    success: L.snackbar.deleted,
    errorMessage: recordErrorMessage,
    fallbackError: L.snackbar.failed,
    submission: submission.reply()
  });
}
