'use server';

import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/features/auth/server/requireAuth';
import { recordErrorMessage } from '@/features/record/domain/error-message';
import { settlementCompleteSchema } from '@/features/record/schemas/settlement-schema';
import { completeSettlement } from '@/features/record/server/services';
import { lastDayOfMonthJst, startOfDayJst } from '@/lib/shared/domain/date';
import { L } from '@/lib/shared/labels';
import {
  type FormActionResult,
  ToastType,
  toFormResult
} from '@/lib/shared/types/formResult';

// 集計›精算の完了。record の書き込みなので record が所有し、summary の画面から呼ぶ。
//
// 精算画面はフォームを持たず 3 ステップの state から入力を組むので、FormData ではなく
// オブジェクトで受けて zod で検証する。遷移せずトーストを返す。
//
// 精算 record の日付は月末（原典「9月30日付けで」）。
// 再検証はルートの layout 単位。精算 record はカレンダー・集計の両方に効く。

const ROOT_PATH = '/';

export async function completeSettlementAction(
  input: unknown
): Promise<FormActionResult> {
  const parsed = settlementCompleteSchema.safeParse(input);
  if (!parsed.success) {
    return {
      toast: {
        type: ToastType.error,
        message: parsed.error.issues[0]?.message ?? L.snackbar.failed
      }
    };
  }
  const session = await requireAuth();
  const { yearMonth, ids, isPay, methodId, price } = parsed.data;

  const result = await completeSettlement(session, {
    datetime: startOfDayJst(lastDayOfMonthJst(`${yearMonth}-01`)),
    ids,
    isPay,
    methodId,
    price
  });
  revalidatePath(ROOT_PATH, 'layout');
  return toFormResult(result, {
    // 記録を作らない（差額なし）ときは立替を精算済みにしただけなので「変更」。
    success: price > 0 ? L.snackbar.created : L.snackbar.updated,
    errorMessage: recordErrorMessage,
    fallbackError: L.snackbar.failed
  });
}
