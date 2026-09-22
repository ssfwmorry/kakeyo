'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import type { ColorClassification } from '@/features/master';
import { planColorHex } from '../color';

// 色ピッカー。FormField はテキスト系専用のため、色は hidden input + 色ボタングリッド
// で表現する。選択中の colorId を hidden input に載せて Conform の colorId に渡す。
// type-method / bank の ColorPicker を踏襲（feature 間 import を避け自前に持つ）。

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
                backgroundColor: planColorHex(color.name),
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
