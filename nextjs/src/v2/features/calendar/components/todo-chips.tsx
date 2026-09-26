'use client';

import { useState, useTransition } from 'react';
import { useFormToast } from '@/components/form/use-form-toast';
import { IconClose, IconShare } from '@/components/icons';
import type { MemoItem } from '@/features/memo';
import { deleteMemoAction } from '@/features/memo/actions';
import type { FormActionResult } from '@/lib/shared/types/formResult';
import { TodoSheet } from './todo-sheet';

// TODO の帯（原典 Calendar）。見出しと件数の下に、チップを折り返して並べる。
// 末尾の「＋ 追加」で追加シートを開く。
//
// 削除は × で即時（確認なし）。TODO は短い文なので、消しても書き直しが軽い。
// 共有の TODO は人のアイコンを添えて区別する。

export function TodoChips({
  memos,
  hasPair
}: {
  memos: MemoItem[];
  hasPair: boolean;
}) {
  const [isAdding, setIsAdding] = useState(false);

  return (
    <div className='flex flex-col gap-2'>
      <div className='flex items-baseline gap-1.5 text-muted-foreground text-xs'>
        <span className='font-bold tracking-[0.04em]'>TODO</span>
        <span>{memos.length}件</span>
      </div>
      <div className='flex flex-wrap gap-1.5'>
        {memos.map((memo) => (
          <TodoChip key={memo.id} memo={memo} />
        ))}
        <button
          className='h-8 whitespace-nowrap rounded-2xl border border-dash border-dashed px-3 text-[13px] text-muted-foreground'
          onClick={() => setIsAdding(true)}
          type='button'
        >
          ＋ 追加
        </button>
      </div>

      {isAdding ? (
        <TodoSheet
          hasPair={hasPair}
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              setIsAdding(false);
            }
          }}
        />
      ) : null}
    </div>
  );
}

function TodoChip({ memo }: { memo: MemoItem }) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<FormActionResult | null>(null);
  useFormToast(result);

  const remove = () => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set('id', String(memo.id));
      setResult(await deleteMemoAction(null, formData));
    });
  };

  return (
    <span className='flex h-8 max-w-full items-center gap-1 whitespace-nowrap rounded-2xl bg-card pr-0.5 pl-3 text-[13px]'>
      {memo.isPair ? (
        <IconShare
          aria-label='共有'
          className='size-3.5 shrink-0 text-primary'
          role='img'
          strokeWidth={2}
        />
      ) : null}
      <span className='truncate'>{memo.memo}</span>
      <button
        aria-label={`${memo.memo}を削除`}
        className='flex size-7 shrink-0 items-center justify-center rounded-full text-icon-muted disabled:opacity-50'
        disabled={isPending}
        onClick={remove}
        type='button'
      >
        <IconClose aria-hidden='true' className='size-3' strokeWidth={2.6} />
      </button>
    </span>
  );
}
