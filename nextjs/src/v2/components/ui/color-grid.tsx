'use client';

import { useState } from 'react';
import { IconCheck } from '@/components/icons';
import type { ColorClassification } from '@/features/master';
import { colorVar } from '@/features/master';

// 色の選択。6 列のグリッドで、選択中は色の上にチェックを重ねる（デザイン基礎の各シート）。
//
// 既存 components/form/color-picker.tsx との違いは、色を hex 直書きではなく
// CSS 変数（colorVar）で塗ることと、選択中の印が「●」ではなくチェック + リングなこと。
// 選択中の colorId は hidden input に載せて Conform のフィールドへ渡す。

export function ColorGrid({
  name,
  label,
  colors,
  defaultColorId,
  errors,
  errorId
}: {
  name: string;
  label: string;
  colors: ColorClassification[];
  defaultColorId?: number;
  errors?: string[];
  errorId?: string;
}) {
  const [selectedId, setSelectedId] = useState<number | undefined>(
    defaultColorId
  );

  return (
    <div className='flex flex-col gap-2'>
      <span className='pl-1 text-[13px] text-muted-foreground'>{label}</span>
      <input name={name} readOnly type='hidden' value={selectedId ?? ''} />
      <div className='grid grid-cols-6 justify-items-center gap-3 rounded-2xl bg-card p-3.5'>
        {colors.map((color) => {
          const isSelected = color.id === selectedId;
          return (
            <button
              aria-label={color.name}
              aria-pressed={isSelected}
              className='flex size-10 items-center justify-center rounded-full'
              key={color.id}
              onClick={() => setSelectedId(color.id)}
              style={{
                backgroundColor: colorVar(color.name),
                // 選択中は面の色で 1 本抜いてから色のリングを出す。色同士が
                // 隣接していても選択が分かる。
                boxShadow: isSelected
                  ? `0 0 0 3px var(--card), 0 0 0 5px ${colorVar(color.name)}`
                  : undefined
              }}
              type='button'
            >
              {isSelected ? (
                <IconCheck
                  aria-hidden='true'
                  className='size-4.5 text-[var(--cat-on)]'
                  strokeWidth={3}
                />
              ) : null}
            </button>
          );
        })}
      </div>
      {errors ? (
        <p className='px-1 text-destructive text-sm' id={errorId} role='alert'>
          {errors.join(' / ')}
        </p>
      ) : null}
    </div>
  );
}
