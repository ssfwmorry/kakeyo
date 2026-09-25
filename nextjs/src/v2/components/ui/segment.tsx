'use client';

import { cn } from 'cn';

// 2〜3 択のセグメント。shadcn の Tabs を置き換える（デザイン基礎「Tabs → セグメント」）。
// 面（弱）の地に、選択中だけ面の色で浮かせる。
//
// 「個人｜共有」だけは全画面共通で挙動も違う（Server Action で Cookie を書く）ため、
// この部品ではなく PairModeSegment を使う。

export function Segment<T extends string>({
  options,
  value,
  onChange,
  label
}: {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  // スクリーンリーダー向けの群の名前。
  label: string;
}) {
  return (
    <fieldset
      aria-label={label}
      className='flex rounded-[10px] bg-muted p-[3px]'
    >
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <button
            aria-pressed={isSelected}
            className={cn(
              'h-8 flex-grow basis-0 rounded-lg font-semibold text-sm',
              isSelected
                ? 'bg-card text-foreground shadow-sm'
                : 'bg-transparent text-muted-foreground'
            )}
            key={option.value}
            onClick={() => onChange(option.value)}
            type='button'
          >
            {option.label}
          </button>
        );
      })}
    </fieldset>
  );
}
