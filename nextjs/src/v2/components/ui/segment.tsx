'use client';

import { cn } from 'cn';
import type { ReactNode } from 'react';

// 2〜3 択のセグメント。shadcn の Tabs を置き換える（デザイン基礎「Tabs → セグメント」）。
// 面（弱）の地に、選択中だけ面の色で浮かせる。
//
// 大きさはデザインの画面ごとに違うので size で選ぶ:
// - sm: h28 / 13px（個人｜共有。PairModeSegment が使う）
// - md: h32 / 14px（集計の内訳｜推移｜精算、カテゴリの支出｜収入）
// - lg: h34 / 15px（入力フローの支出｜収入）
// - xl: h40〜44 で 2 段表記（「自分が立替／あとで精算する」）。option.sub に副文を渡す。
//
// disabled な選択肢は押せない見た目で残す（集計の推移・精算のように、
// デザインはあるが中身が保留のもの）。
//
// 「個人｜共有」だけは全画面共通で挙動も違う（Server Action で Cookie を書く）ため、
// この部品ではなく PairModeSegment を使う。

export type SegmentOption<T extends string> = {
  value: T;
  label: ReactNode;
  // xl のときの副文。
  sub?: ReactNode;
  disabled?: boolean;
};

const SIZE_CLASS = {
  sm: {
    outer: 'rounded-[9px] p-0.5',
    item: 'h-7 rounded-[7px] px-3 text-[13px]'
  },
  md: { outer: 'rounded-[10px] p-[3px]', item: 'h-8 rounded-lg text-sm' },
  lg: { outer: 'rounded-[10px] p-[3px]', item: 'h-8.5 rounded-lg text-[15px]' },
  xl: { outer: 'rounded-[10px] p-[3px]', item: 'h-11 rounded-lg text-sm' }
} as const;

export function Segment<T extends string>({
  options,
  value,
  onChange,
  label,
  size = 'md',
  className
}: {
  options: readonly SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  // スクリーンリーダー向けの群の名前。
  label: string;
  size?: keyof typeof SIZE_CLASS;
  className?: string;
}) {
  const sizeClass = SIZE_CLASS[size];
  return (
    <fieldset
      aria-label={label}
      className={cn('flex bg-muted', sizeClass.outer, className)}
    >
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <button
            aria-pressed={isSelected}
            className={cn(
              'flex flex-grow basis-0 flex-col items-center justify-center font-semibold disabled:opacity-40',
              sizeClass.item,
              isSelected
                ? 'bg-segment-on text-foreground shadow-[0_1px_2px_rgba(0,0,0,0.12)]'
                : 'bg-transparent text-muted-foreground',
              size === 'sm' && !isSelected && 'font-normal'
            )}
            disabled={option.disabled}
            key={option.value}
            onClick={() => onChange(option.value)}
            type='button'
          >
            <span className={cn(size === 'xl' && 'font-bold')}>
              {option.label}
            </span>
            {size === 'xl' && option.sub !== undefined ? (
              <span className='font-normal text-[11px] text-muted-foreground'>
                {option.sub}
              </span>
            ) : null}
          </button>
        );
      })}
    </fieldset>
  );
}
