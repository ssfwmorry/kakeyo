'use client';

import { useEffect } from 'react';
import type { FormActionResult } from '@/lib/shared/types/formResult';

// 保存/削除の成功（success トースト）でダイアログを閉じる共通フック。
// 各 feature の設定ダイアログ（bank / plan-reminder / type-method …）が共有する。
export function useCloseOnSuccess(
  result: FormActionResult | null | undefined,
  onOpenChange: (open: boolean) => void
) {
  useEffect(() => {
    if (result?.toast?.type === 'success') {
      onOpenChange(false);
    }
  }, [result, onOpenChange]);
}
