import type { SubmissionResult } from '@conform-to/react';

// Conform を使う Server Action の共通戻り値型（凍結資産・フォーム標準）。
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
