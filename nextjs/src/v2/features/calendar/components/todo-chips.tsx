'use client';

import { useState, useTransition } from 'react';
import { useFormToast } from '@/components/form/use-form-toast';
import { IconClose, IconShare } from '@/components/icons';
import type { MemoItem } from '@/features/memo-shortcut';
import { deleteMemoAction } from '@/features/memo-shortcut/actions';
import type { FormActionResult } from '@/lib/shared/types/formResult';

// TODO を横並びのチップで出す（デザイン基礎 Calendar）。
//
// 旧画面は縦のリストで 1 行ずつ削除ボタンを持っていたが、新デザインでは
// カレンダーと日別リストの間に挟まる帯なので、横スクロールのチップにする。
// 件数が増えても縦の場所を取らない。
//
// 共有の TODO は人のアイコンを添えて区別する。

export function TodoChips({ memos }: { memos: MemoItem[] }) {
  return (
    <div className='-mx-4 flex items-center gap-2 overflow-x-auto px-4'>
      <span className='shrink-0 font-bold text-muted-foreground text-xs tracking-wide'>
        TODO
      </span>
      {memos.map((memo) => (
        <TodoChip key={memo.id} memo={memo} />
      ))}
      {/* 追加はカレンダーからではなく旧画面の導線に合わせる。新デザインの
          「＋ 追加」はシートを開く想定だが、TODO 自体の見直しが別途あるため
          ここでは出さない。 */}
      {memos.length === 0 ? (
        <span className='text-muted-foreground text-sm'>ありません</span>
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
    <span className='flex h-8 shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-card pr-1 pl-3 text-[13px]'>
      {memo.isPair ? (
        <IconShare
          aria-label='ペアと共有'
          className='size-3.5 text-muted-foreground'
        />
      ) : null}
      {memo.memo}
      <button
        aria-label={`${memo.memo} を削除`}
        className='flex size-6 items-center justify-center rounded-full text-muted-foreground disabled:opacity-50'
        disabled={isPending}
        onClick={remove}
        type='button'
      >
        <IconClose aria-hidden='true' className='size-3.5' />
      </button>
    </span>
  );
}
