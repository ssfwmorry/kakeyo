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
  planUpsertSchema,
  reminderInsertSchema
} from './schemas';
import * as service from './server/services';
import type { PlanReminderError } from './types';

// 予定・予定カテゴリ・リマインダーの Server Actions。どれも画面の上に出るシートから呼ばれ、
// 保存しても画面に留まるので、遷移せず FormActionResult.toast を返し再検証で取り直す。

const SETTING_PATH = '/setting';
const CALENDAR_PATH = '/calendar';

// 設定はトップ（件数）と詳細画面（一覧）に分かれるので、layout 単位でまとめて再検証する。
function revalidateSetting(): void {
  revalidatePath(SETTING_PATH, 'layout');
}

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
  const { name, colorId, date, memo, rule } = submission.value;
  const result = await service.insertReminder(session, {
    name,
    date,
    memo,
    colorId,
    isPair,
    rule
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

// ids は並べ替え後の順で受ける。
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

// 個人/共有はシート右上のトグル（フォーム値）で決める。画面のペアモードとは独立に選べるようにするため。
// 共有なのにペア未設定なら resolveOwner が pairRequired、scope 外・不存在なら service が
// notInScope を返すので、フォーム値を信用しても他ペアの予定は書き換えられない。
export async function savePlanAction(
  _prev: FormActionResult | null,
  formData: FormData
): Promise<FormActionResult> {
  const submission = parseWithZod(formData, { schema: planUpsertSchema });
  if (submission.status !== 'success') {
    return { submission: submission.reply() };
  }
  const session = await requireAuth();
  const { id, name, startDate, endDate, planTypeId, memo, isPair } =
    submission.value;
  const result = await service.upsertPlan(session, {
    id,
    name,
    startDate,
    endDate,
    planTypeId,
    memo,
    isPair
  });
  revalidatePath(CALENDAR_PATH);
  return toFormResult(result, {
    success: id === undefined ? L.snackbar.created : L.snackbar.updated,
    errorMessage: planReminderErrorMessage,
    fallbackError: L.snackbar.failed,
    submission: submission.reply()
  });
}

export async function deletePlanAction(
  _prev: FormActionResult | null,
  formData: FormData
): Promise<FormActionResult> {
  const submission = parseWithZod(formData, { schema: deleteSchema });
  if (submission.status !== 'success') {
    return { submission: submission.reply() };
  }
  const session = await requireAuth();
  const result = await service.deletePlan(session, submission.value.id);
  revalidatePath(CALENDAR_PATH);
  return toFormResult(result, {
    success: L.snackbar.deleted,
    errorMessage: planReminderErrorMessage,
    fallbackError: L.snackbar.failed,
    submission: submission.reply()
  });
}
