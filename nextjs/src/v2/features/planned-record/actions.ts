'use server';

import { parseWithZod } from '@conform-to/zod/v4';
import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/features/auth/server/requireAuth';
import { plannedRecordErrorMessage } from '@/features/planned-record/domain/error-message';
import {
  plannedRecordDeleteSchema,
  plannedRecordUpsertSchema
} from '@/features/planned-record/schemas';
import * as service from '@/features/planned-record/server/services';
import { getEffectivePairMode } from '@/lib/server/pair/mode';
import { L } from '@/lib/shared/labels';
import type { SessionData } from '@/lib/shared/types/auth';
import {
  type FormActionResult,
  toFormResult
} from '@/lib/shared/types/formResult';
import type { Id } from '@/lib/shared/types/id';

// 設定›定期の記録（新デザイン）の登録・更新・削除。スキーマとサービスは旧 /note と同じ。
//
// 旧 /note は保存後に /setting へ遷移するため flash 通知だったが、新デザインは
// 一覧の上に出るシートで、保存しても一覧に留まる。そのため遷移せず
// FormActionResult.toast を返す。
//
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
