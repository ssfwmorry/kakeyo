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
import { typeMethodLabels } from './labels';
import {
  deleteSchema,
  methodUpsertSchema,
  subTypeUpsertSchema,
  typeUpsertSchema
} from './schemas';
import * as service from './server/services';
import type { TypeMethodError } from './types';

// 設定画面（/setting）の Server Actions。login-actions を手本に
// parseWithZod → service（Result）→ toFormResult。setting は遷移しないため
// flash ではなく FormActionResult.toast を使う。保存後 revalidatePath で再取得。

const SETTING_PATH = '/setting';

// service の失敗分類 → ユーザ向け文言。foreignKey は削除時の紐づきエラー。
function errorMessage(error: TypeMethodError): string | undefined {
  switch (error) {
    case 'foreignKey':
      return L.error.hasRelatedData;
    case 'pairRequired':
      return typeMethodLabels.error.pairRequired;
    case 'notInScope':
      return L.error.notFound;
    default:
      return undefined;
  }
}

// Result → FormActionResult 変換の共通化（success 文言と submission を渡す）。
function toResult(
  result: Result<void, TypeMethodError>,
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

export async function upsertTypeAction(
  _prev: FormActionResult | null,
  formData: FormData
): Promise<FormActionResult> {
  const submission = parseWithZod(formData, { schema: typeUpsertSchema });
  if (submission.status !== 'success') {
    return { submission: submission.reply() };
  }
  const session = await requireAuth();
  const { id, name, colorId, isPay, isPair } = submission.value;
  const result = await service.upsertType(session, {
    id,
    name,
    colorId,
    isPay,
    isPair
  });
  revalidatePath(SETTING_PATH);
  return toResult(
    result,
    id === undefined ? L.snackbar.created : L.snackbar.updated,
    submission.reply()
  );
}

export async function deleteTypeAction(
  _prev: FormActionResult | null,
  formData: FormData
): Promise<FormActionResult> {
  const submission = parseWithZod(formData, { schema: deleteSchema });
  if (submission.status !== 'success') {
    return { submission: submission.reply() };
  }
  const session = await requireAuth();
  const result = await service.deleteType(session, submission.value.id);
  revalidatePath(SETTING_PATH);
  return toResult(result, L.snackbar.deleted, submission.reply());
}

export async function upsertSubTypeAction(
  _prev: FormActionResult | null,
  formData: FormData
): Promise<FormActionResult> {
  const submission = parseWithZod(formData, { schema: subTypeUpsertSchema });
  if (submission.status !== 'success') {
    return { submission: submission.reply() };
  }
  const session = await requireAuth();
  const { id, typeId, name } = submission.value;
  const result = await service.upsertSubType(session, { id, typeId, name });
  revalidatePath(SETTING_PATH);
  return toResult(
    result,
    id === undefined ? L.snackbar.created : L.snackbar.updated,
    submission.reply()
  );
}

export async function deleteSubTypeAction(
  _prev: FormActionResult | null,
  formData: FormData
): Promise<FormActionResult> {
  const submission = parseWithZod(formData, { schema: deleteSchema });
  if (submission.status !== 'success') {
    return { submission: submission.reply() };
  }
  const session = await requireAuth();
  const result = await service.deleteSubType(session, submission.value.id);
  revalidatePath(SETTING_PATH);
  return toResult(result, L.snackbar.deleted, submission.reply());
}

export async function upsertMethodAction(
  _prev: FormActionResult | null,
  formData: FormData
): Promise<FormActionResult> {
  const submission = parseWithZod(formData, { schema: methodUpsertSchema });
  if (submission.status !== 'success') {
    return { submission: submission.reply() };
  }
  const session = await requireAuth();
  const { id, name, colorId, payMode, isPair } = submission.value;
  const result = await service.upsertMethod(session, {
    id,
    name,
    colorId,
    payMode,
    isPair
  });
  revalidatePath(SETTING_PATH);
  return toResult(
    result,
    id === undefined ? L.snackbar.created : L.snackbar.updated,
    submission.reply()
  );
}

export async function deleteMethodAction(
  _prev: FormActionResult | null,
  formData: FormData
): Promise<FormActionResult> {
  const submission = parseWithZod(formData, { schema: deleteSchema });
  if (submission.status !== 'success') {
    return { submission: submission.reply() };
  }
  const session = await requireAuth();
  const result = await service.deleteMethod(session, submission.value.id);
  revalidatePath(SETTING_PATH);
  return toResult(result, L.snackbar.deleted, submission.reply());
}

// ボタン起動のため Conform を通さず素の Server Action。id は number で受ける。
export async function swapTypeAction(
  prevId: number,
  nextId: number
): Promise<FormActionResult> {
  const session = await requireAuth();
  const result = await service.swapType(session, prevId, nextId);
  revalidatePath(SETTING_PATH);
  return toResult(result, L.snackbar.swapped);
}

export async function swapSubTypeAction(
  prevId: number,
  nextId: number
): Promise<FormActionResult> {
  const session = await requireAuth();
  const result = await service.swapSubType(session, prevId, nextId);
  revalidatePath(SETTING_PATH);
  return toResult(result, L.snackbar.swapped);
}

export async function swapMethodAction(
  prevId: number,
  nextId: number
): Promise<FormActionResult> {
  const session = await requireAuth();
  const result = await service.swapMethod(session, prevId, nextId);
  revalidatePath(SETTING_PATH);
  return toResult(result, L.snackbar.swapped);
}
