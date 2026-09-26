'use server';

import { parseWithZod } from '@conform-to/zod/v4';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAuth } from '@/features/auth/server/requireAuth';
import { setFlashToast } from '@/lib/server/flash';
import { getPairMode } from '@/lib/server/pair/mode';
import { reorderIdsSchema } from '@/lib/shared/domain/reorder';
import { L } from '@/lib/shared/labels';
import {
  type FormActionResult,
  ToastType,
  toFormResult
} from '@/lib/shared/types/formResult';
import { plannedRecordErrorMessage as errorMessage } from './domain/error-message';
import {
  plannedRecordDeleteSchema,
  plannedRecordUpsertSchema
} from './schemas';
import * as service from './server/services';

// planned-record（定期）の Server Actions。保存/削除は成功時に setting へ遷移するため
// flash 通知、swap は遷移しないため FormActionResult.toast + revalidatePath。

// 定期の保存/削除後の遷移先。
// /setting は未実装のため、それまでこの redirect は 404 になりうる（暫定状態）。
const SETTING_PATH = '/setting';

// 定期の登録・更新。成功→flash + setting 遷移、失敗→toast 返却（遷移しない）。
export async function upsertPlannedRecordAction(
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
  // ペアモードは Cookie の単一の正から読む（自前で Cookie を読まない・フォーム値も信用しない）。
  const isPair = await getPairMode();

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

  if (!result.ok) {
    return {
      submission: submission.reply(),
      toast: {
        type: ToastType.error,
        message: errorMessage(result.error) ?? L.snackbar.failed
      }
    };
  }

  await setFlashToast({
    type: ToastType.success,
    message: id === undefined ? L.snackbar.created : L.snackbar.updated
  });
  redirect(SETTING_PATH);
}

// 定期の削除。成功→flash + setting 遷移、失敗→toast 返却
// （実体化済み record が紐づく場合は FK エラー文言）。
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

  if (!result.ok) {
    return {
      submission: submission.reply(),
      toast: {
        type: ToastType.error,
        message: errorMessage(result.error) ?? L.snackbar.failed
      }
    };
  }

  await setFlashToast({ type: ToastType.success, message: L.snackbar.deleted });
  redirect(SETTING_PATH);
}

// 並べ替え（設定タブ）。ボタン起動のため Conform を通さず素の Server Action。
export async function swapPlannedRecordAction(
  prevId: number,
  nextId: number
): Promise<FormActionResult> {
  const session = await requireAuth();
  const result = await service.swapPlannedRecord(session, prevId, nextId);
  revalidatePath(SETTING_PATH);
  return toFormResult(result, {
    success: L.snackbar.swapped,
    errorMessage,
    fallbackError: L.snackbar.failed
  });
}

// ドラッグ並べ替え。ids の並びが新しい順。成功の文言は「変更しました」。
// 新デザインの設定は詳細画面ごとにルートが分かれるので、旧 /setting と両方を再検証する。
export async function reorderPlannedRecordAction(
  ids: number[]
): Promise<FormActionResult> {
  const parsed = reorderIdsSchema.safeParse({ ids });
  if (!parsed.success) {
    return { toast: { type: ToastType.error, message: L.snackbar.failed } };
  }
  const session = await requireAuth();
  const result = await service.reorderPlannedRecords(session, parsed.data.ids);
  revalidatePath(SETTING_PATH);
  revalidatePath('/v2/setting', 'layout');
  return toFormResult(result, {
    success: L.snackbar.updated,
    errorMessage,
    fallbackError: L.snackbar.failed
  });
}
