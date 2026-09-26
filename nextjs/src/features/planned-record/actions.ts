'use server';

import { parseWithZod } from '@conform-to/zod/v4';
import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/features/auth/server/requireAuth';
import { getEffectivePairMode } from '@/lib/server/pair/mode';
import { reorderIdsSchema } from '@/lib/shared/domain/reorder';
import { L } from '@/lib/shared/labels';
import type { SessionData } from '@/lib/shared/types/auth';
import {
  type FormActionResult,
  ToastType,
  toFormResult
} from '@/lib/shared/types/formResult';
import type { Id } from '@/lib/shared/types/id';
import { plannedRecordErrorMessage } from './domain/error-message';
import {
  plannedRecordDeleteSchema,
  plannedRecordUpsertSchema
} from './schemas';
import * as service from './server/services';

// 設定›定期の記録の登録・更新・削除・並べ替え。一覧の上に出るシートで保存しても一覧に
// 留まるので、遷移せず FormActionResult.toast を返す。
// 設定はトップ（件数）と一覧に分かれるので layout 単位で再検証する。

const SETTING_PATH = '/setting';

function revalidateSetting(): void {
  revalidatePath(SETTING_PATH, 'layout');
}

export async function savePlannedRecordAction(
  _prev: FormActionResult | null,
  formData: FormData
): Promise<FormActionResult> {
  const submission = parseWithZod(formData, {
    schema: plannedRecordUpsertSchema
  });
  if (submission.status !== 'success') {
    return { submission: submission.reply() };
  }
  const session = await requireAuth();
  const {
    id,
    dayClassificationId,
    isPay,
    isInstead,
    methodId,
    typeId,
    subTypeId,
    price,
    memo
  } = submission.value;

  // 共有／個人は登録時に決まり後から切り替えられない。編集は対象自身の区分に従い、
  // 新規だけ今のモードから決める（どちらもフォーム値は信用しない）。
  const isPair = await resolveIsPair(session, id);

  const result = await service.upsertPlannedRecord(session, {
    id,
    dayClassificationId,
    isPay,
    isInstead,
    methodId,
    typeId,
    subTypeId: subTypeId ?? null,
    price,
    memo,
    isPair
  });
  revalidateSetting();
  return toFormResult(result, {
    success: id === undefined ? L.snackbar.created : L.snackbar.updated,
    errorMessage: plannedRecordErrorMessage,
    fallbackError: L.snackbar.failed,
    submission: submission.reply()
  });
}

async function resolveIsPair(
  session: SessionData,
  id: Id | undefined
): Promise<boolean> {
  if (id === undefined) {
    return getEffectivePairMode(session);
  }
  const target = await service.getPlannedRecordForEdit(session, id);
  return target?.isPair ?? false;
}

export async function deletePlannedRecordAction(
  _prev: FormActionResult | null,
  formData: FormData
): Promise<FormActionResult> {
  const submission = parseWithZod(formData, {
    schema: plannedRecordDeleteSchema
  });
  if (submission.status !== 'success') {
    return { submission: submission.reply() };
  }
  const session = await requireAuth();
  const result = await service.deletePlannedRecord(
    session,
    submission.value.id
  );
  revalidateSetting();
  return toFormResult(result, {
    success: L.snackbar.deleted,
    errorMessage: plannedRecordErrorMessage,
    fallbackError: L.snackbar.failed,
    submission: submission.reply()
  });
}

// ドラッグ並べ替え。ids の並びが新しい順。成功の文言は「変更しました」。
export async function reorderPlannedRecordAction(
  ids: number[]
): Promise<FormActionResult> {
  const parsed = reorderIdsSchema.safeParse({ ids });
  if (!parsed.success) {
    return { toast: { type: ToastType.error, message: L.snackbar.failed } };
  }
  const session = await requireAuth();
  const result = await service.reorderPlannedRecords(session, parsed.data.ids);
  revalidateSetting();
  return toFormResult(result, {
    success: L.snackbar.updated,
    errorMessage: plannedRecordErrorMessage,
    fallbackError: L.snackbar.failed
  });
}
