'use server';

import { parseWithZod } from '@conform-to/zod/v4';
import { redirect } from 'next/navigation';
import { requireAuth } from '@/features/auth/server/requireAuth';
import { recordErrorMessage } from '@/features/record/domain/error-message';
import { recordUpsertSchema } from '@/features/record/schemas/record-schema';
import { upsertRecord } from '@/features/record/server/services';
import { setFlashToast } from '@/lib/server/flash';
import { getPairMode } from '@/lib/server/pair/mode';
import { startOfDayJst } from '@/lib/shared/domain/date';
import { L } from '@/lib/shared/labels';
import {
  type FormActionResult,
  ToastType
} from '@/lib/shared/types/formResult';

// 入力フロー（新デザイン）の record 登録。スキーマとサービスは旧 /note と同じで、
// 違いは着地先が /v2/calendar なことだけ。旧 Action の redirect 先は固定なので
// v2 用に薄く持つ。旧画面を消すときにこちらを本体にする。
//
// 成功時は遷移するので flash 通知、失敗（遷移しない）は FormActionResult.toast で返す。

const CALENDAR_PATH = '/v2/calendar';

export async function createRecordAction(
  _prev: FormActionResult | null,
  formData: FormData
): Promise<FormActionResult> {
  const submission = parseWithZod(formData, { schema: recordUpsertSchema });
  if (submission.status !== 'success') {
    return { submission: submission.reply() };
  }
  const session = await requireAuth();
  // ペアモードは Cookie の単一の正から読む（フォーム値を信用しない）。
  const isPair = await getPairMode();

  const { date, isPay, isInstead, methodId, typeId, subTypeId, price, memo } =
    submission.value;

  // 新規専用。id はスキーマ上 optional だが、編集は T13 の別画面が持つのでここでは渡さない。
  const result = await upsertRecord(session, {
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
    message: L.snackbar.created
  });
  redirect(CALENDAR_PATH);
}
