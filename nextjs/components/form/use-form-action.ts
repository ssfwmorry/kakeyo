'use client';

import { useActionState } from 'react';
import type { FormActionResult } from '@/lib/types/formResult';
import { useFormToast } from './use-form-toast';

// useActionState と useFormToast を一体化するフォーム標準フック。
// Server Action は FormActionResult を返す前提。これにより各フォームで
// useActionState と useFormToast を別々に宣言する必要がなくなり、
// 「結果購読（トースト発火）の書き忘れ」も構造的に防ぐ。
//
// 戻り値は useActionState と同一の [result, dispatch, isPending]。
// action のシグネチャは useActionState にそのまま委譲するため、
// prev/payload を取るもの・取らないもの（デモログイン等）双方に対応する。

export function useFormAction<Payload>(
  action: (
    prev: FormActionResult | null,
    payload: Payload
  ) => FormActionResult | Promise<FormActionResult>
) {
  const state = useActionState(action, null);
  useFormToast(state[0]);
  return state;
}
