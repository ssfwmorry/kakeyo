'use client';

import { cn } from 'cn';
import { useState } from 'react';
import { IconCheck } from '@/components/icons';
import type { ColorClassification } from '@/features/master';
import { colorVar } from '@/features/master';

// 色の選択。白い面の 6 列グリッド（デザイン基礎の各シート）。
//
// 大きさは 2 種: 編集画面（SetTypeEdit）は 40px でチェックを重ねる、シートの中
// （SetMethod / SetPlanType / SetBank / SetReminder）は 36px でリングだけ。
// 選択中は面の色で 1 本抜いてから色のリングを出す。色同士が隣接していても選択が分かる。
//
// 既存 components/form/color-picker.tsx との違いは、色を hex 直書きではなく
// CSS 変数（colorVar）で塗ること。選択中の colorId は hidden input に載せて
// Conform のフィールドへ渡す。初期選択は既定で先頭の色（README D3）。

export function ColorGrid({
  name,
  label,
  colors,
  defaultColorId,
  size = 40,
  onChange,
  errors,
  errorId
}: {
  name: string;
  label: string;
  colors: ColorClassification[];
  // 省略時は先頭の色。
  defaultColorId?: number;
  size?: 40 | 36;
  // 選択が変わったとき。プレビュー（編集画面の大きな丸）を追従させるのに使う。
  onChange?: (color: ColorClassification) => void;
  errors?: string[];
  errorId?: string;
}) {
  const [selectedId, setSelectedId] = useState<number | undefined>(
    defaultColorId ?? colors[0]?.id
  );

  return (
    <div className='flex flex-col gap-2'>
      <span className='pl-1 text-[13px] text-muted-foreground'>{label}</span>
      <input name={name} readOnly type='hidden' value={selectedId ?? ''} />
      <div className='grid grid-cols-6 justify-items-center gap-3 rounded-[14px] bg-card p-3.5'>
        {colors.map((color) => {
          const isSelected = color.id === selectedId;
          return (
            <button
              aria-label={color.name}
              aria-pressed={isSelected}
              className={cn(
                'flex items-center justify-center rounded-full',
                size === 40 ? 'size-10' : 'size-9'
              )}
              key={color.id}
              onClick={() => {
                setSelectedId(color.id);
                onChange?.(color);
              }}
              style={{
                backgroundColor: colorVar(color.name),
                boxShadow: isSelected
                  ? `0 0 0 3px var(--card), 0 0 0 5px ${colorVar(color.name)}`
                  : undefined
              }}
              type='button'
            >
              {isSelected && size === 40 ? (
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
