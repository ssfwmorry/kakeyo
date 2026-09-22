'use client';

import { useState, useTransition } from 'react';
import { useFormToast } from '@/components/form/use-form-toast';
import { Button } from '@/components/ui/button';
import type { FormActionResult } from '@/lib/shared/types/formResult';

// 並べ替えボタン。Conform を通さず素の Server Action（swapPlannedRecordAction）を呼ぶ。
// 結果 toast は useFormToast で発火。useTransition で二重押しを抑止する
// （type-method / plan-reminder の SwapButton を踏襲）。

type SwapButtonProps = {
  prevId: number;
  nextId: number;
  action: (prevId: number, nextId: number) => Promise<FormActionResult>;
  label: string;
  icon: string;
};

export function SwapButton({
  prevId,
  nextId,
  action,
  label,
  icon
}: SwapButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<FormActionResult | null>(null);
  useFormToast(result);

  return (
    <Button
      type='button'
      size='icon'
      variant='ghost'
      aria-label={label}
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          setResult(await action(prevId, nextId));
        })
      }
    >
      {icon}
    </Button>
  );
}
