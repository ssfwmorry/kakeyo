'use client';

import type { ReactNode } from 'react';
import { useFormStatus } from 'react-dom';

// シート上端の「キャンセル｜見出し｜保存」。デザイン基礎のシートは全てこの形を持つ。
//
// 保存は form の submit なので、このバーは form の内側に置く。送信中は
// useFormStatus で押せなくする（二重送信の防止）。

export function SheetActionBar({
  children,
  onCancel
}: {
  // 中央に置く見出し。
  children: ReactNode;
  onCancel: () => void;
}) {
  return (
    <div className='grid h-10 grid-cols-[1fr_auto_1fr] items-center'>
      <button
        className='justify-self-start text-base text-primary'
        onClick={onCancel}
        type='button'
      >
        キャンセル
      </button>
      {children}
      <SaveButton />
    </div>
  );
}

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      className='justify-self-end font-bold text-base text-primary disabled:opacity-50'
      disabled={pending}
      type='submit'
    >
      保存
    </button>
  );
}
