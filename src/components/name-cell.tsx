'use client';

import type { ReactNode } from 'react';
import { InitialCircle } from '@/components/initial-circle';
import { ListCellSortable } from '@/components/list-cell';

// カテゴリ・方法・予定カテゴリの 1 行。色の丸 + 名前。

export function NameCell({
  name,
  colorName,
  description,
  isFirst,
  handle,
  onOpen,
  ariaLabel
}: {
  name: string;
  colorName: string;
  // カテゴリのサブカテゴリ一覧など、名前の下に出す補足。
  description?: string;
  isFirst: boolean;
  handle: ReactNode;
  onOpen: () => void;
  // 行のアクセシブルネーム。省略すると名前がそのまま読まれる。
  ariaLabel?: string;
}) {
  return (
    <ListCellSortable
      aria-label={ariaLabel}
      description={description}
      handle={handle}
      height={52}
      isFirst={isFirst}
      label={name}
      leading={<InitialCircle colorName={colorName} name={name} />}
      leadingWidth={32}
      onClick={onOpen}
    />
  );
}
