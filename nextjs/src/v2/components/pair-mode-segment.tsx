'use client';

import { cn } from 'cn';
import { usePathname } from 'next/navigation';
import { useOptimistic, useTransition } from 'react';
import { IconLock } from '@/components/icons';
import { setPairModeAction } from '@/features/layout/actions/pair-mode-actions';

// 「個人｜共有」。新デザインでは Switch ではなく 2 択のセグメントで、全画面の右上に同じ形で置く
// （デザイン基礎「個人｜共有（全画面で同じ部品・同じ右上の位置）」）。
//
// 表示条件と Cookie 更新の仕組みは既存の PairModeSwitch と同じで、Server Action で
// Cookie を書いて現在ページを再検証する。サーバ往復のあいだ選択が動かないと
// 「押しても反応しない」体感になるため useOptimistic で先行反映する。
//
// 編集中（isLocked）は押せない。対象は作成時に共有／個人が決まり後から移せないので、
// 切り替えても編集できず入力中の値を失うだけになるため。薄くして右に鍵を添える。
//
// ペアを組んでいないユーザには出さない（README D6）。共有側にデータが無いので
// 切り替える意味がない。

export function PairModeSegment({
  isPair,
  isLocked = false,
  hasPair = true
}: {
  isPair: boolean;
  isLocked?: boolean;
  hasPair?: boolean;
}) {
  const pathname = usePathname();
  const [, startTransition] = useTransition();
  const [optimisticIsPair, setOptimisticIsPair] = useOptimistic(isPair);

  if (!hasPair) {
    return null;
  }

  const select = (next: boolean) => {
    if (isLocked || next === optimisticIsPair) {
      return;
    }
    startTransition(async () => {
      setOptimisticIsPair(next);
      await setPairModeAction(next, pathname);
    });
  };

  return (
    <span className='flex items-center gap-1.5'>
      {/* 2 つのボタンで 1 つの選択を表すため fieldset でまとめる。 */}
      <fieldset
        aria-label='表示するモード'
        className={cn(
          'flex rounded-[9px] bg-muted p-0.5',
          isLocked && 'opacity-55'
        )}
      >
        <SegmentButton
          isLocked={isLocked}
          isSelected={!optimisticIsPair}
          label='個人'
          onSelect={() => select(false)}
        />
        <SegmentButton
          isLocked={isLocked}
          isSelected={optimisticIsPair}
          label='共有'
          onSelect={() => select(true)}
        />
      </fieldset>
      {isLocked ? (
        <IconLock
          aria-label='編集中は切り替えられません'
          className='size-3 text-muted-foreground'
        />
      ) : null}
    </span>
  );
}

function SegmentButton({
  label,
  isSelected,
  isLocked,
  onSelect
}: {
  label: string;
  isSelected: boolean;
  isLocked: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      aria-pressed={isSelected}
      className={cn(
        'h-7 rounded-[7px] px-3 font-semibold text-[13px]',
        isSelected
          ? 'bg-segment-on text-foreground shadow-[0_1px_2px_rgba(0,0,0,0.12)]'
          : 'bg-transparent font-normal text-muted-foreground'
      )}
      disabled={isLocked}
      onClick={onSelect}
      type='button'
    >
      {label}
    </button>
  );
}
