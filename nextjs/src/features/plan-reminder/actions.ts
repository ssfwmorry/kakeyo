'use server';

import type { SubmissionResult } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod/v4';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAuth } from '@/features/auth/server/requireAuth';
import { setFlashToast } from '@/lib/server/flash';
import { getPairMode } from '@/lib/server/pair/mode';
import { L } from '@/lib/shared/labels';
import {
  type FormActionResult,
  ToastType,
  toFormResult
} from '@/lib/shared/types/formResult';
import type { Result } from '@/lib/shared/types/result';
import { planReminderLabels } from './labels';
import {
  deleteSchema,
  planTypeUpsertSchema,
  planUpsertSchema,
  reminderInsertSchema
} from './schemas';
import * as service from './server/services';
import type { PlanReminderError } from './types';

// plan/reminder の Server Actions。
// - PLAN（予定入力画面）: 保存/削除後に /calendar へ遷移するため flash トーストを使う。
// - PLAN TYPE / REMINDER（設定「予定管理」タブ）: 同一画面内更新のため
//   FormActionResult.toast を使い、保存後 revalidatePath('/setting') で再取得する。

const SETTING_PATH = '/setting';
const CALENDAR_PATH = '/calendar';

// service の失敗分類 → ユーザ向け文言。
function errorMessage(error: PlanReminderError): string | undefined {
  switch (error) {
    case 'foreignKey':
      return L.error.hasRelatedData;
    case 'pairRequired':
      return planReminderLabels.error.pairRequired;
    case 'notInScope':
      return L.error.notFound;
    default:
      return undefined;
  }
}

// Result → FormActionResult 変換（設定タブ用。遷移しないため toast を返す）。
function toResult(
  result: Result<void, PlanReminderError>,
  success: string,
  submission?: SubmissionResult
): FormActionResult {
  return toFormResult(result, {
    success,
    errorMessage,
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
  revalidatePath(SETTING_PATH);
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
  revalidatePath(SETTING_PATH);
  return toResult(result, L.snackbar.deleted, submission.reply());
}

// 並べ替え（ボタン起動。Conform を通さず素の Server Action）。
export async function swapPlanTypeAction(
  prevId: number,
  nextId: number
): Promise<FormActionResult> {
  const session = await requireAuth();
  const result = await service.swapPlanType(session, prevId, nextId);
  revalidatePath(SETTING_PATH);
  return toResult(result, L.snackbar.swapped);
}

// 保存/削除後は /calendar へ遷移する。遷移で戻り値が消えるため
// redirect 直前に setFlashToast で通知を Cookie に載せる（二重発火回避のため toast は返さない）。
export async function upsertPlanAction(
  _prev: FormActionResult | null,
  formData: FormData
): Promise<FormActionResult> {
  const submission = parseWithZod(formData, { schema: planUpsertSchema });
  if (submission.status !== 'success') {
    return { submission: submission.reply() };
  }
  const session = await requireAuth();
  // ペアモードは Cookie 由来（自前で Cookie を読まない）。所有列は service で決める。
  const isPair = session.pairId !== null && (await getPairMode());
  const { id, name, startDate, endDate, planTypeId, memo } = submission.value;
  const result = await service.upsertPlan(session, {
    id,
    name,
    startDate,
    endDate,
    planTypeId,
    memo,
    isPair
  });
  if (!result.ok) {
    return toResult(
      result,
      id === undefined ? L.snackbar.created : L.snackbar.updated,
      submission.reply()
    );
  }
  await setFlashToast({
    type: ToastType.success,
    message: id === undefined ? L.snackbar.created : L.snackbar.updated
  });
  redirect(CALENDAR_PATH);
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
  if (!result.ok) {
    return toResult(result, L.snackbar.deleted, submission.reply());
  }
  await setFlashToast({ type: ToastType.success, message: L.snackbar.deleted });
  redirect(CALENDAR_PATH);
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
  const isPair = session.pairId !== null && (await getPairMode());
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
  revalidatePath(SETTING_PATH);
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
  revalidatePath(SETTING_PATH);
  return toResult(result, L.snackbar.deleted, submission.reply());
}

// リマインダーのチェック消化（ボタン起動。素の Server Action）。
export async function checkReminderAction(
  reminderId: number
): Promise<FormActionResult> {
  const session = await requireAuth();
  const result = await service.checkReminder(session, reminderId);
  // 設定画面のリマインダー一覧を再検証する。
  revalidatePath(SETTING_PATH);
  // 消化は共通レイアウトの通知ベル（全 (private) 画面のヘッダに常設）からも起動される。
  // ベルの件数/一覧は (private)/layout.tsx が取得する dueReminders に依存するため、
  // layout を再検証して消化結果を反映させる（setPairMode と同じ layout 再検証方式）。
  revalidatePath('/', 'layout');
  return toResult(result, L.snackbar.updated);
}
