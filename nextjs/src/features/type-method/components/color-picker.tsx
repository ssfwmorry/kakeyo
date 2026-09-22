'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import type { ColorClassification } from '@/features/master';
import { colorHex } from '../color';

// 色ピッカー。FormField はテキスト系専用のため、色は hidden input + 色ボタングリッド
// で表現する。選択中の colorId を hidden input に載せて Conform の colorId に渡す。

type ColorPickerProps = {
  name: string;
  label: string;
  colors: ColorClassification[];
  defaultColorId?: number;
  errors?: string[];
  errorId?: string;
};

export function ColorPicker({
  name,
  label,
  colors,
  defaultColorId,
  errors,
  errorId
}: ColorPickerProps) {
  const [selected, setSelected] = useState<number | undefined>(defaultColorId);
  return (
    <div className='flex flex-col gap-2'>
      <Label>{label}</Label>
      <input type='hidden' name={name} value={selected ?? ''} readOnly />
      <div className='flex flex-wrap gap-2'>
        {colors.map((color) => {
          const isSelected = color.id === selected;
          return (
            <button
              key={color.id}
              type='button'
              aria-label={color.name}
              aria-pressed={isSelected}
              onClick={() => setSelected(color.id)}
              className='size-7 rounded-full border-2 transition'
              style={{
                backgroundColor: colorHex(color.name),
                borderColor: isSelected ? '#111827' : 'transparent'
              }}
            />
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
