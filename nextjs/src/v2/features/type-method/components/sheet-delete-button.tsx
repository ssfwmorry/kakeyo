'use client';

import { useState, useTransition } from 'react';
import { useFormToast } from '@/components/form/use-form-toast';
import type { FormActionResult } from '@/lib/shared/types/formResult';
import { ConfirmAlert } from '@/v2/components/ui/confirm-alert';

// シート末尾の削除。白い面に赤い文字で、保存とは離して置く。
//
// 確認は v2 の ConfirmAlert。削除フォームは名前・色のフォームとは別物なので、
// submit ではなく Server Action を直接呼ぶ（同じ form に入れると保存と削除が
// 1 つの submit に混ざる）。

export function SheetDeleteButton({
  id,
  label,
  confirmMessage,
  action,
  onDeleted
}: {
  id: number;
  label: string;
  confirmMessage: string;
  // 削除の Server Action（id だけを FormData で受け取る共通形）。
  action: (
    prev: FormActionResult | null,
    formData: FormData
  ) => Promise<FormActionResult>;
  onDeleted: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [isConfirming, setIsConfirming] = useState(false);
  const [result, setResult] = useState<FormActionResult | null>(null);
  useFormToast(result);

  const remove = () => {
    setIsConfirming(false);
    startTransition(async () => {
      const formData = new FormData();
      formData.set('id', String(id));
      const next = await action(null, formData);
      setResult(next);
      // 失敗（紐づく記録がある等）ならシートは開いたままにして、文言を読ませる。
      if (next.toast?.type === 'success') {
        onDeleted();
      }
    });
  };

  return (
    <>
      <button
        className='h-12 rounded-[14px] bg-card font-semibold text-base text-destructive disabled:opacity-50'
        disabled={isPending}
        onClick={() => setIsConfirming(true)}
        type='button'
      >
        {label}
      </button>
      <ConfirmAlert
        onCancel={() => setIsConfirming(false)}
        onConfirm={remove}
        open={isConfirming}
        pending={isPending}
        title={confirmMessage}
      />
    </>
  );
}
