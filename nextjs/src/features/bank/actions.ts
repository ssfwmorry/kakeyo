'use server';

import type { SubmissionResult } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod/v4';
import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/features/auth/server/requireAuth';
import { L } from '@/lib/shared/labels';
import {
  type FormActionResult,
  toFormResult
} from '@/lib/shared/types/formResult';
import type { Result } from '@/lib/shared/types/result';
import { bankLabels } from './labels';
import { bankBalanceFormSchema } from './schemas/bank-balance-schema';
import { bankDeleteSchema, bankFormSchema } from './schemas/bank-schema';
import * as service from './server/services';
import type { BankError } from './types';

// bank 画面（/bank）と設定口座タブの Server Actions。login-actions を手本に
// parseWithZod → service（Result）→ toFormResult。bank 画面 / 設定タブは同一画面内
// 更新（遷移なし）のため flash ではなく FormActionResult.toast を使い、保存後
// revalidatePath('/bank') で再取得する（二重発火回避のため flash は使わない）。

const BANK_PATH = '/bank';

// service の失敗分類 → ユーザ向け文言。
function errorMessage(error: BankError): string | undefined {
  switch (error) {
    case 'foreignKey':
      return L.error.hasRelatedData;
    case 'notFound':
      return bankLabels.error.bankNotFound;
    case 'notOwned':
      return bankLabels.error.bankNotFound;
    default:
      return undefined;
  }
}

// Result → FormActionResult 変換の共通化。
function toResult(
  result: Result<void, BankError>,
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

export async function upsertBankAction(
  _prev: FormActionResult | null,
  formData: FormData
): Promise<FormActionResult> {
  const submission = parseWithZod(formData, { schema: bankFormSchema });
  if (submission.status !== 'success') {
    return { submission: submission.reply() };
  }
  const session = await requireAuth();
  const { id, name, colorId } = submission.value;
  const result = await service.upsertBank(session, { id, name, colorId });
  revalidatePath(BANK_PATH);
  return toResult(
    result,
    id === undefined ? L.snackbar.created : L.snackbar.updated,
    submission.reply()
  );
}

export async function deleteBankAction(
  _prev: FormActionResult | null,
  formData: FormData
): Promise<FormActionResult> {
  const submission = parseWithZod(formData, { schema: bankDeleteSchema });
  if (submission.status !== 'success') {
    return { submission: submission.reply() };
  }
  const session = await requireAuth();
  const result = await service.deleteBank(session, submission.value.id);
  revalidatePath(BANK_PATH);
  return toResult(result, L.snackbar.deleted, submission.reply());
}

export async function postBankBalancesAction(
  _prev: FormActionResult | null,
  formData: FormData
): Promise<FormActionResult> {
  const submission = parseWithZod(formData, { schema: bankBalanceFormSchema });
  if (submission.status !== 'success') {
    return { submission: submission.reply() };
  }
  const session = await requireAuth();
  const result = await service.postBankBalances(session, submission.value.rows);
  revalidatePath(BANK_PATH);
  return toResult(result, L.snackbar.created, submission.reply());
}
