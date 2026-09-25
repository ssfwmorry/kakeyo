'use client';

import type { ReactNode } from 'react';
import { BottomSheetTitle } from '@/v2/components/ui/bottom-sheet';

// 記録シートの上端。「キャンセル｜見出し｜右の要素」。
// 左を「戻る」に差し替えられるのは、サブカテゴリと金額の画面が 1 枚目へ戻るため。

export function SheetHeader({
  title,
  right,
  onCancel,
  back
}: {
  title: ReactNode;
  right?: ReactNode;
  onCancel?: () => void;
  // 指定すると左が「キャンセル」ではなく「＜ 戻る」になる。
  back?: { label: string; onClick: () => void };
}) {
  return (
    <div className='grid h-10 grid-cols-[1fr_auto_1fr] items-center'>
      {back === undefined ? (
        <button
          className='justify-self-start text-base text-primary'
          onClick={onCancel}
          type='button'
        >
          キャンセル
        </button>
      ) : (
        <button
          className='justify-self-start text-base text-primary'
          onClick={back.onClick}
          type='button'
        >
          ‹ {back.label}
        </button>
      )}
      {typeof title === 'string' ? (
        <BottomSheetTitle className='text-[17px]'>{title}</BottomSheetTitle>
      ) : (
        title
      )}
      <span className='justify-self-end'>{right}</span>
    </div>
  );
}
