'use server';

import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/features/auth/server/requireAuth';
import { planReminderErrorMessage } from '@/features/plan-reminder/domain/error-message';
import * as service from '@/features/plan-reminder/server/services';
import { L } from '@/lib/shared/labels';
import {
  type FormActionResult,
  toFormResult
} from '@/lib/shared/types/formResult';
import { quoted } from '@/v2/lib/format';

// お知らせシート（新デザイン）の「確認」。リマインダーを次の日付へ進める。
//
// 旧 checkReminderAction と service は同じだが、成功の文言に対象名を入れる
// （「「電気代の支払い」を確認しました」）のと、再検証の対象が v2 配下
// （ベルは設定・カレンダーの両方にあり、日別リストのリマインダー行も変わる）なので分けている。
// 旧画面のベルと設定も当面は同時に再検証する。

export async function checkReminderAction(
  reminderId: number
): Promise<FormActionResult> {
  const session = await requireAuth();
  // 文言用の名前は scope 内の一覧から引く（クライアントから受けた値は表示にも使わない）。
  const target = (await service.getReminderList(session)).all.find(
    (reminder) => reminder.id === reminderId
  );
  const result = await service.checkReminder(session, reminderId);
  revalidatePath('/v2', 'layout');
  revalidatePath('/setting');
  revalidatePath('/', 'layout');
  return toFormResult(result, {
    success:
      target === undefined
        ? L.snackbar.checked
        : `${quoted(target.name)}を${L.snackbar.checked}`,
    errorMessage: planReminderErrorMessage,
    fallbackError: L.snackbar.failed
  });
}
