'use client';

import { useEffect } from 'react';
import { showToast } from '@/lib/shared/toast/show-toast';
import type { FormActionResult } from '@/lib/shared/types/formResult';

// サーバ検証（parseWithZod）に落ちたときの文言をトーストで出す。
//
// シートは入力欄の下にエラーを出す場所を持たず、主ボタンの活性を
// クライアント状態で切り替えて必須エラー自体を出さない。それでもサーバの検証に
// 落ちたとき（文字数超過など）は、黙って何も起きないより理由を見せる。

export function submissionErrorMessage(
  result: FormActionResult | null | undefined
): string | null {
  const submission = result?.submission;
  if (submission?.status !== 'error' || result?.toast !== undefined) {
    return null;
  }
  const messages = Object.values(submission.error ?? {}).flatMap(
    (errors) => errors ?? []
  );
  return messages.length === 0 ? null : messages.join(' / ');
}

export function useSubmissionErrorToast(
  result: FormActionResult | null | undefined
): void {
  useEffect(() => {
    const message = submissionErrorMessage(result);
    if (message !== null) {
      showToast({ type: 'error', message });
    }
  }, [result]);
}
