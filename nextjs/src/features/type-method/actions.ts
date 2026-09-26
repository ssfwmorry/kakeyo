'use server';

import type { SubmissionResult } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod/v4';
import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/features/auth/server/requireAuth';
import { reorderIdsSchema } from '@/lib/shared/domain/reorder';
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

// 設定はトップ（件数）と詳細画面（一覧）に分かれるので、layout 単位でまとめて再検証する。
function revalidateSetting(): void {
  revalidatePath(SETTING_PATH, 'layout');
}

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
  revalidateSetting();
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
  revalidateSetting();
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
  revalidateSetting();
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
  revalidateSetting();
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
  revalidateSetting();
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
  revalidateSetting();
  return toResult(result, L.snackbar.deleted, submission.reply());
}

// ドラッグ並べ替え。ids の並びが新しい順。ボタン起動と同じく Conform を通さず、
// 配列の形だけをスキーマで確かめる。成功の文言は「変更しました」（入れ替えではない）。
export async function reorderTypeAction(
  ids: number[]
): Promise<FormActionResult> {
  const parsed = reorderIdsSchema.safeParse({ ids });
  if (!parsed.success) {
    return { toast: { type: 'error', message: L.snackbar.failed } };
  }
  const session = await requireAuth();
  const result = await service.reorderTypes(session, parsed.data.ids);
  revalidateSetting();
  return toResult(result, L.snackbar.updated);
}

export async function reorderSubTypeAction(
  typeId: number,
  ids: number[]
): Promise<FormActionResult> {
  const parsed = reorderIdsSchema.safeParse({ ids });
  if (!parsed.success) {
    return { toast: { type: 'error', message: L.snackbar.failed } };
  }
  const session = await requireAuth();
  const result = await service.reorderSubTypes(
    session,
    typeId,
    parsed.data.ids
  );
  revalidateSetting();
  return toResult(result, L.snackbar.updated);
}

export async function reorderMethodAction(
  ids: number[]
): Promise<FormActionResult> {
  const parsed = reorderIdsSchema.safeParse({ ids });
  if (!parsed.success) {
    return { toast: { type: 'error', message: L.snackbar.failed } };
  }
  const session = await requireAuth();
  const result = await service.reorderMethods(session, parsed.data.ids);
  revalidateSetting();
  return toResult(result, L.snackbar.updated);
}
