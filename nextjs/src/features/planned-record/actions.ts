'use server';

import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/features/auth/server/requireAuth';
import { reorderIdsSchema } from '@/lib/shared/domain/reorder';
import { L } from '@/lib/shared/labels';
import {
  type FormActionResult,
  ToastType,
  toFormResult
} from '@/lib/shared/types/formResult';
import { plannedRecordErrorMessage as errorMessage } from './domain/error-message';
import * as service from './server/services';

// planned-record（定期）の並べ替え Server Action。登録・更新・削除はシート側の Action
// （v2/features/planned-record/actions.ts）が持つ。

const SETTING_PATH = '/setting';

// ドラッグ並べ替え。ids の並びが新しい順。成功の文言は「変更しました」。
// 設定はトップ（件数）と一覧に分かれるので layout 単位で再検証する。
export async function reorderPlannedRecordAction(
  ids: number[]
): Promise<FormActionResult> {
  const parsed = reorderIdsSchema.safeParse({ ids });
  if (!parsed.success) {
    return { toast: { type: ToastType.error, message: L.snackbar.failed } };
  }
  const session = await requireAuth();
  const result = await service.reorderPlannedRecords(session, parsed.data.ids);
  revalidatePath(SETTING_PATH, 'layout');
  return toFormResult(result, {
    success: L.snackbar.updated,
    errorMessage,
    fallbackError: L.snackbar.failed
  });
}
