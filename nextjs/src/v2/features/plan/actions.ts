'use server';

import { parseWithZod } from '@conform-to/zod/v4';
import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/features/auth/server/requireAuth';
import { planReminderErrorMessage } from '@/features/plan-reminder/domain/error-message';
import {
  deleteSchema,
  planUpsertSchema
} from '@/features/plan-reminder/schemas';
import * as service from '@/features/plan-reminder/server/services';
import { getEffectivePairMode } from '@/lib/server/pair/mode';
import { L } from '@/lib/shared/labels';
import type { SessionData } from '@/lib/shared/types/auth';
import {
  type FormActionResult,
  toFormResult
} from '@/lib/shared/types/formResult';

// 予定シート（新デザイン）の Server Actions。
//
// 旧 /plan は保存後に /calendar へ遷移するため flash 通知だったが、新デザインは
// カレンダーの上に出るシートで、保存してもカレンダーに留まる。そのため遷移せず
// FormActionResult.toast を返し、シートを閉じた側で月を取り直す。
// スキーマとサービスは旧と同じ。

const V2_CALENDAR_PATH = '/v2/calendar';

export async function savePlanAction(
  _prev: FormActionResult | null,
  formData: FormData
): Promise<FormActionResult> {
  const submission = parseWithZod(formData, { schema: planUpsertSchema });
  if (submission.status !== 'success') {
    return { submission: submission.reply() };
  }
  const session = await requireAuth();
  const { id, name, startDate, endDate, planTypeId, memo } = submission.value;
  // 共有か個人かは作成時に決まり後から移せない。新規は今のモード、編集は対象自身の
  // 区分に従う（フォーム値は信用しない）。scope 外・不存在なら service が notInScope を返す。
  const isPair = await resolveIsPair(session, id);
  const result = await service.upsertPlan(session, {
    id,
    name,
    startDate,
    endDate,
    planTypeId,
    memo,
    isPair
  });
  revalidatePath(V2_CALENDAR_PATH);
  return toFormResult(result, {
    success: id === undefined ? L.snackbar.created : L.snackbar.updated,
    errorMessage: planReminderErrorMessage,
    fallbackError: L.snackbar.failed,
    submission: submission.reply()
  });
}

async function resolveIsPair(
  session: SessionData,
  id: number | undefined
): Promise<boolean> {
  if (id === undefined) {
    return getEffectivePairMode(session);
  }
  const target = await service.getPlanForEdit(session, id);
  return target?.isPair ?? false;
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
  revalidatePath(V2_CALENDAR_PATH);
  return toFormResult(result, {
    success: L.snackbar.deleted,
    errorMessage: planReminderErrorMessage,
    fallbackError: L.snackbar.failed,
    submission: submission.reply()
  });
}
