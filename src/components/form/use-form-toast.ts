'use client';

import { useEffect, useRef } from 'react';
import type { FormActionResult } from '@/lib/shared/types/formResult';
import { useToastPresenter } from './toast-presenter';

// Server Action の結果（FormActionResult）に埋め込まれた toast を自動発火する
// （フォーム標準）。全フォームがこのフックで「レスポンス→トースト」を
// 一律に処理し、各画面で toast.xxx を手書きしない。
//
// 出し方はレイアウトが context で決める（toast-presenter.tsx）。
//
// useActionState の結果は再レンダリングのたびに同じ参照を返しうるため、
// 「同じ結果で二重発火」しないよう直近に発火した結果を ref で覚えて弾く。

export function useFormToast(result: FormActionResult | null | undefined) {
  const present = useToastPresenter();
  const lastFired = useRef<FormActionResult | null | undefined>(null);

  useEffect(() => {
    if (!result?.toast || result === lastFired.current) {
      return;
    }
    lastFired.current = result;
    present(result.toast);
  }, [result, present]);
}
