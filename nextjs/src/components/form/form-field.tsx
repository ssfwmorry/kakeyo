'use client';

import { type FieldMetadata, getInputProps } from '@conform-to/react';
import type { ComponentProps } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Conform 配線済みの汎用フォーム項目（label + Input + field エラー）。
// 全ドメインの入力フォームはこの部品で「1 フィールド = FormField 1 個」に揃える
// （getInputProps・aria 属性・エラー表示の手配線を各画面で繰り返さない）。

// FormField が扱う input type。テキスト系の入力で使うものに絞る
// （checkbox/radio 等は別部品にする方が UI 上も自然なため含めない）。
type InputType =
  | 'text'
  | 'email'
  | 'password'
  | 'number'
  | 'tel'
  | 'url'
  | 'search'
  | 'date'
  | 'month';

type FormFieldProps = {
  label: string;
  // Conform の useForm が返す fields.xxx をそのまま渡す。
  field: FieldMetadata<string>;
  // <input type> を指定（email / password / text / number 等）。
  type?: InputType;
  autoComplete?: ComponentProps<'input'>['autoComplete'];
  placeholder?: string;
};

export function FormField({
  label,
  field,
  type = 'text',
  autoComplete,
  placeholder
}: FormFieldProps) {
  const inputProps = getInputProps(field, { type });
  return (
    <div className='flex flex-col gap-2'>
      <Label htmlFor={inputProps.id}>{label}</Label>
      <Input
        {...inputProps}
        autoComplete={autoComplete}
        placeholder={placeholder}
      />
      {field.errors ? (
        <p id={field.errorId} className='text-sm text-red-600' role='alert'>
          {field.errors.join(' / ')}
        </p>
      ) : null}
    </div>
  );
}
