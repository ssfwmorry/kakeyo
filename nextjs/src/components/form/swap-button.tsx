'use client';

import type { ReactNode } from 'react';
import { useState, useTransition } from 'react';
import { useFormToast } from '@/components/form/use-form-toast';
import { Button } from '@/components/ui/button';
import type { FormActionResult } from '@/lib/shared/types/formResult';

// 並べ替えボタン。Conform を通さず素の Server Action（swap*Action）を呼ぶ。
// 結果 toast は useFormToast で発火。useTransition で二重押しを抑止する。
// type-method / plan-reminder / planned-record の各並べ替えで共有する。

type SwapButtonProps = {
  prevId: number;
  nextId: number;
  action: (prevId: number, nextId: number) => Promise<FormActionResult>;
  label: string;
  // アイコン要素（共通定義 Icons の矢印を渡す。文字グリフは使わない）。
  icon: ReactNode;
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
