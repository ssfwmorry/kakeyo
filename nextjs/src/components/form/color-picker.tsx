'use client';

import { cn } from 'cn';
import { useState } from 'react';
import { Label } from '@/components/ui/label';
import type { ColorClassification } from '@/features/master';
import { colorHex } from '@/features/master';

// 色ピッカー（フォーム共通）。FormField はテキスト系専用のため、色は hidden input +
// 色ボタングリッドで表現する。選択中の colorId を hidden input に載せて Conform の
// colorId フィールドに渡す。type-method / plan-reminder / bank の各フォームが共有する。
//
// 並びは 6 列固定グリッド、選択中は色の上に「●」を重ねる
// （折り返し＋枠線だと色数が変わるたび行構成が動き、枠線は淡色で見分けにくい）。
//
// 形状は一覧のマーカーに合わせる（丸いマーカーになる色を四角で選ばせない）。
// マーカーを持たず名前を着色するだけの方法・口座は既定の四角のままでよい。

type ColorPickerProps = {
  name: string;
  label: string;
  colors: ColorClassification[];
  defaultColorId?: number;
  errors?: string[];
  errorId?: string;
  // 一覧マーカーの形。'circle'（家計カテゴリ）/ 'square'（既定）。
  shape?: 'circle' | 'square';
};

export function ColorPicker({
  name,
  label,
  colors,
  defaultColorId,
  errors,
  errorId,
  shape = 'square'
}: ColorPickerProps) {
  const [selected, setSelected] = useState<number | undefined>(defaultColorId);
  return (
    <div className='flex flex-col gap-2'>
      <Label>{label}</Label>
      <input type='hidden' name={name} value={selected ?? ''} readOnly />
      <div className='grid grid-cols-6 gap-2'>
        {colors.map((color) => {
          const isSelected = color.id === selected;
          return (
            <button
              key={color.id}
              type='button'
              aria-label={color.name}
              aria-pressed={isSelected}
              onClick={() => setSelected(color.id)}
              className={cn(
                'flex size-9 items-center justify-center text-white',
                shape === 'circle' ? 'rounded-full' : 'rounded-md'
              )}
              style={{ backgroundColor: colorHex(color.name) }}
            >
              {isSelected ? <span aria-hidden>●</span> : null}
            </button>
          );
        })}
      </div>
      {errors ? (
        <p id={errorId} className='text-sm text-red-600' role='alert'>
          {errors.join(' / ')}
        </p>
      ) : null}
    </div>
  );
}
