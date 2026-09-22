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
import { memoShortcutLabels } from './labels';
import { memoDeleteSchema, memoFormSchema } from './schemas/memo-schema';
import * as service from './server/services';
import type { MemoError } from './types';

// memo（TODO）の Server Actions。bank/type-method を手本に
// parseWithZod → service（Result）→ toFormResult。
// TODO は calendar 内の同一画面内更新（遷移なし）のため flash ではなく
// FormActionResult.toast を使い、保存後 revalidatePath('/calendar') で再取得する。
// ※ calendar 本体の統合は P5。ここでは revalidatePath 先を /calendar に固定し、
//   統合レーンがそのパスに memo/shortcut を表示する前提で用意する。

const CALENDAR_PATH = '/calendar';

// service の失敗分類 → ユーザ向け文言。
function errorMessage(error: MemoError): string | undefined {
  switch (error) {
    case 'notFound':
      return L.error.notFound;
    case 'pairRequired':
      return memoShortcutLabels.error.pairRequired;
    default:
      return undefined;
  }
}

// Result → FormActionResult 変換の共通化。
function toResult(
  result: Result<void, MemoError>,
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

export async function insertMemoAction(
  _prev: FormActionResult | null,
  formData: FormData
): Promise<FormActionResult> {
  const submission = parseWithZod(formData, { schema: memoFormSchema });
  if (submission.status !== 'success') {
    return { submission: submission.reply() };
  }
  const session = await requireAuth();
  const { memo, isPair } = submission.value;
  const result = await service.insertMemo(session, { memo, isPair });
  revalidatePath(CALENDAR_PATH);
  return toResult(result, L.snackbar.created, submission.reply());
}

export async function deleteMemoAction(
  _prev: FormActionResult | null,
  formData: FormData
): Promise<FormActionResult> {
  const submission = parseWithZod(formData, { schema: memoDeleteSchema });
  if (submission.status !== 'success') {
    return { submission: submission.reply() };
  }
  const session = await requireAuth();
  const result = await service.deleteMemo(session, submission.value.id);
  revalidatePath(CALENDAR_PATH);
  return toResult(result, L.snackbar.deleted, submission.reply());
}
