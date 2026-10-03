'use server';

import { parseWithZod } from '@conform-to/zod/v4';
import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/features/auth/server/requireAuth';
import { recordErrorMessage } from '@/features/record/domain/error-message';
import {
  recordDeleteSchema,
  recordUpsertSchema
} from '@/features/record/schemas/record-schema';
import {
  deleteRecord,
  getRecordForEdit,
  upsertRecord
} from '@/features/record/server/services';
import type { RecordError } from '@/features/record/types';
import { dateWithCurrentTimeJst } from '@/lib/shared/domain/date';
import { L } from '@/lib/shared/labels';
import type { SessionData } from '@/lib/shared/types/auth';
import {
  type FormActionResult,
  toFormResult
} from '@/lib/shared/types/formResult';
import type { Id } from '@/lib/shared/types/id';
import { err } from '@/lib/shared/types/result';

// 入力モーダルの登録・更新・削除。
//
// モーダルはどのタブの上にも出て、保存しても元のタブに留まる。そのため遷移せず
// FormActionResult.toast を返し、モーダルを閉じた側で月を取り直す。
//
// 再検証はルートの layout 単位。記録はカレンダーだけでなく集計・口座にも効くうえ、
// 入力はどのタブからでも開くため。

const ROOT_PATH = '/';

export async function upsertRecordAction(
  _prev: FormActionResult | null,
  formData: FormData
): Promise<FormActionResult> {
  const submission = parseWithZod(formData, { schema: recordUpsertSchema });
  if (submission.status !== 'success') {
    return { submission: submission.reply() };
  }
  const session = await requireAuth();

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

  const isPair = await resolveIsPair(session, id, submission.value.isPair);
  if (isPair === null) {
    return toFormResult(err<RecordError>('scopeLocked'), {
      success: L.snackbar.updated,
      errorMessage: recordErrorMessage,
      fallbackError: L.snackbar.failed,
      submission: submission.reply()
    });
  }

  const result = await upsertRecord(session, {
    id,
    datetime: dateWithCurrentTimeJst(date),
    isPay,
    isInstead,
    methodId,
    typeId,
    subTypeId: subTypeId ?? null,
    price,
    memo,
    isPair
  });
  revalidatePath(ROOT_PATH, 'layout');
  return toFormResult(result, {
    success: id === undefined ? L.snackbar.created : L.snackbar.updated,
    errorMessage: recordErrorMessage,
    fallbackError: L.snackbar.failed,
    submission: submission.reply()
  });
}

// 個人/共有はシート右上のトグル（フォーム値）で決める。画面のペアモードとは独立に選べるようにするため。
// 共有なのにペア未設定なら upsertRecord が pairRequired で弾く。
// 移せない対象に別の区分が来たら null で弾く。対象が引けないときは false で進め、
// scope の判定は upsertRecord に任せる。
async function resolveIsPair(
  session: SessionData,
  id: Id | undefined,
  requested: boolean
): Promise<boolean | null> {
  if (id === undefined) {
    return requested;
  }
  const target = await getRecordForEdit(session, id);
  if (target === null) {
    return false;
  }
  if (target.isScopeLocked && requested !== target.isPair) {
    return null;
  }
  return requested;
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
  revalidatePath(ROOT_PATH, 'layout');
  return toFormResult(result, {
    success: L.snackbar.deleted,
    errorMessage: recordErrorMessage,
    fallbackError: L.snackbar.failed,
    submission: submission.reply()
  });
}
