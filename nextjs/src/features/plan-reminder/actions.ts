'use server';

import type { SubmissionResult } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod/v4';
import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/features/auth/server/requireAuth';
import { getEffectivePairMode } from '@/lib/server/pair/mode';
import { reorderIdsSchema } from '@/lib/shared/domain/reorder';
import { L } from '@/lib/shared/labels';
import {
  type FormActionResult,
  toFormResult
} from '@/lib/shared/types/formResult';
import type { Result } from '@/lib/shared/types/result';
import { planReminderErrorMessage } from './domain/error-message';
import {
  deleteSchema,
  planTypeUpsertSchema,
  reminderInsertSchema
} from './schemas';
import * as service from './server/services';
import type { PlanReminderError } from './types';

// 予定カテゴリ・リマインダーの Server Actions。同一画面内更新のため
// FormActionResult.toast を使い、保存後 revalidateSetting() で再取得する。
// 予定（カレンダーのシート）の保存・削除は v2/features/plan/actions.ts が持つ。

const SETTING_PATH = '/setting';

// 設定はトップ（件数）と詳細画面（一覧）に分かれるので、layout 単位でまとめて再検証する。
function revalidateSetting(): void {
  revalidatePath(SETTING_PATH, 'layout');
}

// Result → FormActionResult 変換（設定タブ用。遷移しないため toast を返す）。
function toResult(
  result: Result<void, PlanReminderError>,
  success: string,
  submission?: SubmissionResult
): FormActionResult {
  return toFormResult(result, {
    success,
    errorMessage: planReminderErrorMessage,
    fallbackError: L.snackbar.failed,
    submission
  });
}

export async function upsertPlanTypeAction(
  _prev: FormActionResult | null,
  formData: FormData
): Promise<FormActionResult> {
  const submission = parseWithZod(formData, { schema: planTypeUpsertSchema });
  if (submission.status !== 'success') {
    return { submission: submission.reply() };
  }
  const session = await requireAuth();
  const { id, name, colorId, isPair } = submission.value;
  const result = await service.upsertPlanType(session, {
    id,
    name,
    colorId,
    isPair
  });
  revalidateSetting();
  return toResult(
    result,
    id === undefined ? L.snackbar.created : L.snackbar.updated,
    submission.reply()
  );
}

export async function deletePlanTypeAction(
  _prev: FormActionResult | null,
  formData: FormData
): Promise<FormActionResult> {
  const submission = parseWithZod(formData, { schema: deleteSchema });
  if (submission.status !== 'success') {
    return { submission: submission.reply() };
  }
  const session = await requireAuth();
  const result = await service.deletePlanType(session, submission.value.id);
  revalidateSetting();
  return toResult(result, L.snackbar.deleted, submission.reply());
}

export async function insertReminderAction(
  _prev: FormActionResult | null,
  formData: FormData
): Promise<FormActionResult> {
  const submission = parseWithZod(formData, { schema: reminderInsertSchema });
  if (submission.status !== 'success') {
    return { submission: submission.reply() };
  }
  const session = await requireAuth();
  const isPair = await getEffectivePairMode(session);
  const {
    name,
    colorId,
    date,
    memo,
    reminderType,
    conditionType,
    month,
    baseType,
    monthDay
  } = submission.value;
  const result = await service.insertReminder(session, {
    name,
    reminderType,
    date,
    memo,
    colorId,
    isPair,
    condition: { conditionType, month, monthDay, baseType }
  });
  revalidateSetting();
  return toResult(result, L.snackbar.created, submission.reply());
}

export async function deleteReminderAction(
  _prev: FormActionResult | null,
  formData: FormData
): Promise<FormActionResult> {
  const submission = parseWithZod(formData, { schema: deleteSchema });
  if (submission.status !== 'success') {
    return { submission: submission.reply() };
  }
  const session = await requireAuth();
  const result = await service.deleteReminder(session, submission.value.id);
  revalidateSetting();
  return toResult(result, L.snackbar.deleted, submission.reply());
}

// ドラッグ並べ替え。ids の並びが新しい順。成功の文言は「変更しました」。
export async function reorderPlanTypeAction(
  ids: number[]
): Promise<FormActionResult> {
  const parsed = reorderIdsSchema.safeParse({ ids });
  if (!parsed.success) {
    return { toast: { type: 'error', message: L.snackbar.failed } };
  }
  const session = await requireAuth();
  const result = await service.reorderPlanTypes(session, parsed.data.ids);
  revalidateSetting();
  return toResult(result, L.snackbar.updated);
}
