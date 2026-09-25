'use client';

import { useState } from 'react';
import { IconBell } from '@/components/icons';
import type { NotifyRow } from '../domain/notify-rows';
import { NotifySheet } from './notify-sheet';
import { useNotifySheetState } from './notify-sheet-state';

// ベルのボタン本体とバッジ。押すとお知らせシートを開く（リンクではない）。
//
// 行はサーバで計算済みのものを受け、シートで「確認」した行は表示から外す。
// 再検証で props が入れ替わったあとは、外した id が含まれなくなるので放置してよい。
//
// 開閉状態は画面が Provider で持つこともある（カレンダーの日別リストからも開くため）。

export function NotificationBellButton({ rows }: { rows: NotifyRow[] }) {
  const [isOpen, setIsOpen] = useNotifySheetState();
  const [checkedIds, setCheckedIds] = useState<ReadonlySet<number>>(
    () => new Set()
  );
  const visibleRows = rows.filter((row) => !checkedIds.has(row.id));
  const count = visibleRows.length;

  return (
    <>
      <button
        aria-label={`お知らせ（${count}件）`}
        className='-ml-2.5 relative flex size-11 items-center justify-center text-foreground'
        onClick={() => setIsOpen(true)}
        type='button'
      >
        <IconBell aria-hidden='true' className='size-[22px]' strokeWidth={2} />
        {count > 0 ? (
          <span className='absolute top-[7px] right-[7px] flex h-4 min-w-4 items-center justify-center rounded-lg bg-destructive px-1 font-bold text-[10px] text-white'>
            {count}
          </span>
        ) : null}
      </button>

      <NotifySheet
        isOpen={isOpen}
        onChecked={(id) =>
          setCheckedIds((prev) => {
            const next = new Set(prev);
            next.add(id);
            return next;
          })
        }
        onOpenChange={setIsOpen}
        rows={visibleRows}
      />
    </>
  );
}
