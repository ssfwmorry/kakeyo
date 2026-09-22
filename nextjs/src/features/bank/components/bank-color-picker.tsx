'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import type { ColorClassification } from '@/features/master';
import { bankColorHex } from '../color';

// 色ピッカー（口座フォーム用）。FormField はテキスト系専用のため、色は
// hidden input + 色ボタングリッドで表現し、選択中の colorId を Conform の
// colorId フィールドに載せる。type-method の ColorPicker と同型だが feature 間
// import 禁止のため bank 内に自前で持つ。

type BankColorPickerProps = {
  name: string;
  label: string;
  colors: ColorClassification[];
  defaultColorId?: number;
  errors?: string[];
  errorId?: string;
};

export function BankColorPicker({
  name,
  label,
  colors,
  defaultColorId,
  errors,
  errorId
}: BankColorPickerProps) {
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
                backgroundColor: bankColorHex(color.name),
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
