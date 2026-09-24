import type { SubmissionResult } from '@conform-to/react';
import type { Result } from '@/lib/shared/types/result';

// Conform を使う Server Action の共通戻り値型（フォーム標準）。
// skill-kick の「action のレスポンスにトースト文言を埋め込み、FE が結果を受けて
// 自動でトースト発火する」発想を App Router 流に。
// - submission : Conform の useForm(lastResult) に渡す field/フォームエラー
// - toast      : 成否通知。クライアントの useFormToast が受けて自動発火する
//
// 全ドメインの入力フォーム（record 登録・plan 登録・設定 CRUD 等）はこの型で
// 「フォーム検証は Conform、成否通知は toast」に揃える（新パターンを発明しない）。

export const ToastType = {
  success: 'success',
  error: 'error',
  info: 'info',
  warning: 'warning'
} as const;

export type ToastType = (typeof ToastType)[keyof typeof ToastType];

export type ToastMessage = {
  type: ToastType;
  message: string;
};

export type FormActionResult = {
  submission?: SubmissionResult;
  toast?: ToastMessage;
};

// サービス層の Result を FormActionResult へ変換する共通ヘルパ。
// 「サービス層＝成否のみ / トースト文言＝Action」の責務分担を 1 箇所に集約し、
// 各レーンが Result→FormActionResult の変換とトースト種別を手書きする重複を防ぐ。
//
// - 成功: success トーストを付ける（文言は各 Action が業務に応じて渡す）
// - 失敗: error トーストを付ける。error → 文言のマッピングは errorMessage で任意に
//         上書きできる（未指定なら fallbackError を出す）
// submission は Conform の検証済み結果を引き継ぎたいときに渡す（省略可）。
export function toFormResult<T, E extends string>(
  result: Result<T, E>,
  options: {
    success: string;
    fallbackError?: string;
    errorMessage?: (error: E) => string | undefined;
    submission?: SubmissionResult;
  }
): FormActionResult {
  if (result.ok) {
    return {
      submission: options.submission,
      toast: { type: ToastType.success, message: options.success }
    };
  }
  const message =
    options.errorMessage?.(result.error) ??
    options.fallbackError ??
    '処理に失敗しました';
  return {
    submission: options.submission,
    toast: { type: ToastType.error, message }
  };
}
