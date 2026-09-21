'use client';

import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import type { FormActionResult } from '@/lib/shared/types/formResult';

// Server Action の結果（FormActionResult）に埋め込まれた toast を自動発火する
// （凍結資産・フォーム標準）。全フォームがこのフックで「レスポンス→トースト」を
// 一律に処理し、各画面で toast.xxx を手書きしない。
//
// useActionState の結果は再レンダリングのたびに同じ参照を返しうるため、
// 「同じ結果で二重発火」しないよう直近に発火した結果を ref で覚えて弾く。

export function useFormToast(result: FormActionResult | null | undefined) {
  const lastFired = useRef<FormActionResult | null | undefined>(null);

  useEffect(() => {
    if (!result?.toast || result === lastFired.current) {
      return;
    }
    lastFired.current = result;

    const { type, message } = result.toast;
    toast[type](message);
  }, [result]);
}
