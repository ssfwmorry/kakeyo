'use client';

import { cn } from 'cn';
import { IconLock } from '@/components/icons';

// 「個人｜共有」の見た目と操作（デザイン基礎「個人｜共有」）。
//
// 状態は持たず onChange で返す。ヘッダーの切替とシートの中の切替で状態の持ち主が
// 違うため、呼び出し側に置く。
//
// isLocked のときは薄くして右に鍵を添え、押せない理由を lockedLabel で伝える。
// hasPair が false なら出さない（共有側にデータが無いので切り替える意味がない・README D6）。
//
// 置き場所はどれも h44 のヘッダーなので、そこに収まる最大の高さを取る。
// 入力の途中で押す切替なので、片手でも外さない大きさを優先する。

export function ScopeSegment({
  isPair,
  isLocked = false,
  hasPair = true,
  lockedLabel = '切り替えられません',
  onChange
}: {
  isPair: boolean;
  isLocked?: boolean;
  hasPair?: boolean;
  lockedLabel?: string;
  onChange: (isPair: boolean) => void;
}) {
  if (!hasPair) {
    return null;
  }

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
          isSelected={!isPair}
          label='個人'
          onSelect={() => onChange(false)}
        />
        <SegmentButton
          isLocked={isLocked}
          isSelected={isPair}
          label='共有'
          onSelect={() => onChange(true)}
        />
      </fieldset>
      {isLocked ? (
        <IconLock
          aria-label={lockedLabel}
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
        'h-8.5 rounded-[7px] px-3.5 font-semibold text-[14px]',
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
