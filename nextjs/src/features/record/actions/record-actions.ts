'use server';

import { parseWithZod } from '@conform-to/zod/v4';
import { redirect } from 'next/navigation';
import { requireAuth } from '@/features/auth/server/requireAuth';
import { setFlashToast } from '@/lib/server/flash';
import { getPairMode } from '@/lib/server/pair/mode';
import { startOfDayJst } from '@/lib/shared/domain/date';
import { L } from '@/lib/shared/labels';
import {
  type FormActionResult,
  ToastType
} from '@/lib/shared/types/formResult';
import { recordErrorMessage } from '../domain/error-message';
import {
  recordDeleteSchema,
  recordUpsertSchema
} from '../schemas/record-schema';
import * as service from '../server/services';

// 記録入力の record 用 Server Actions。保存/削除は成功時に calendar へ遷移する
// ため flash 通知、検証失敗（遷移しない）のみ FormActionResult.toast / submission を返す。

// record 保存/削除後の遷移先。
const CALENDAR_PATH = '/calendar';

// record 登録・更新。成功→flash + calendar 遷移、失敗→toast 返却（遷移しない）。
export async function upsertRecordAction(
  _prev: FormActionResult | null,
  formData: FormData
): Promise<FormActionResult> {
  const submission = parseWithZod(formData, { schema: recordUpsertSchema });
  if (submission.status !== 'success') {
    return { submission: submission.reply() };
  }
  const session = await requireAuth();
  // ペアモードは Cookie の単一の正から読む（自前で Cookie を読まない・フォーム値も信用しない）。
  const isPair = await getPairMode();

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

  const result = await service.upsertRecord(session, {
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

  if (!result.ok) {
    return {
      submission: submission.reply(),
      toast: {
        type: ToastType.error,
        message: recordErrorMessage(result.error) ?? L.snackbar.failed
      }
    };
  }

  await setFlashToast({
    type: ToastType.success,
    message: id === undefined ? L.snackbar.created : L.snackbar.updated
  });
  redirect(`${CALENDAR_PATH}?focus=${date}`);
}

// record 削除。成功→flash + calendar 遷移、失敗→toast 返却。
export async function deleteRecordAction(
  _prev: FormActionResult | null,
  formData: FormData
): Promise<FormActionResult> {
  const submission = parseWithZod(formData, { schema: recordDeleteSchema });
  if (submission.status !== 'success') {
    return { submission: submission.reply() };
  }
  const session = await requireAuth();
  const result = await service.deleteRecord(session, submission.value.id);

  if (!result.ok) {
    return {
      submission: submission.reply(),
      toast: {
        type: ToastType.error,
        message: recordErrorMessage(result.error) ?? L.snackbar.failed
      }
    };
  }

  await setFlashToast({ type: ToastType.success, message: L.snackbar.deleted });
  redirect(CALENDAR_PATH);
}
