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
import { getPairMode } from '@/lib/server/pair/mode';
import { startOfDayJst } from '@/lib/shared/domain/date';
import { L } from '@/lib/shared/labels';
import type { SessionData } from '@/lib/shared/types/auth';
import {
  type FormActionResult,
  toFormResult
} from '@/lib/shared/types/formResult';
import type { Id } from '@/lib/shared/types/id';

// 入力モーダルの登録・更新・削除。
//
// モーダルはどのタブの上にも出て、保存しても元のタブに留まる。そのため遷移せず
// FormActionResult.toast を返し、モーダルを閉じた側で月を取り直す（予定シートと同じ）。
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

  // 共有／個人は記録の作成時に決まり後から移せない。編集は対象自身の区分に従い、
  // 新規だけ Cookie のペアモードから決める（どちらもフォーム値は信用しない）。
  // 対象が引けないときは false で進め、scope の判定は upsertRecord に任せる。
  const isPair = await resolveIsPair(session, id);

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
  revalidatePath(ROOT_PATH, 'layout');
  return toFormResult(result, {
    success: id === undefined ? L.snackbar.created : L.snackbar.updated,
    errorMessage: recordErrorMessage,
    fallbackError: L.snackbar.failed,
    submission: submission.reply()
  });
}

// 編集は対象の区分、新規は Cookie のペアモード。
async function resolveIsPair(
  session: SessionData,
  id: Id | undefined
): Promise<boolean> {
  if (id === undefined) {
    return getPairMode();
  }
  const target = await getRecordForEdit(session, id);
  return target?.isPair ?? false;
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
