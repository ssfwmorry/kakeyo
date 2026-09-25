'use client';

import type { ReactNode } from 'react';
import { SheetHeader as SharedSheetHeader } from '@/v2/components/sheet-header';

// 記録シートの上端。共通の SheetHeader に「閉じる｜戻る」の 2 形を載せる薄い層。
// 入力フローの作り直しで共通部品を直接使うようになったら外す。

export function SheetHeader({
  title,
  right,
  onCancel,
  back
}: {
  title: ReactNode;
  right?: ReactNode;
  onCancel?: () => void;
  // 指定すると左が「閉じる」ではなく「戻る」になる。
  back?: { label: string; onClick: () => void };
}) {
  return back === undefined ? (
    <SharedSheetHeader
      left='close'
      onLeft={onCancel}
      right={right}
      title={title}
    />
  ) : (
    <SharedSheetHeader
      left={{ back: back.label }}
      onLeft={back.onClick}
      right={right}
      title={title}
    />
  );
}
