'use client';

import { type FieldMetadata, getInputProps } from '@conform-to/react';
import { cn } from 'cn';
import { type ComponentProps, useState } from 'react';
import { IconEye, IconEyeOff } from '@/components/icons';
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
  // type='password' のとき、入力欄の右端に表示/伏字の目玉トグルを出す
  // （入力欄の内側末尾に置くアイコン）。
  revealable?: boolean;
};

export function FormField({
  label,
  field,
  type = 'text',
  autoComplete,
  placeholder,
  revealable = false
}: FormFieldProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  // トグルは password のときだけ意味を持つ。表示中は type='text' に切り替える。
  const isToggleShown = revealable && type === 'password';
  const inputProps = getInputProps(field, {
    type: isToggleShown && isRevealed ? 'text' : type
  });

  return (
    <div className='flex flex-col gap-2'>
      <Label htmlFor={inputProps.id}>{label}</Label>
      <div className='relative'>
        <Input
          {...inputProps}
          autoComplete={autoComplete}
          placeholder={placeholder}
          className={cn(isToggleShown && 'pr-10')}
        />
        {isToggleShown ? (
          <button
            type='button'
            aria-label={isRevealed ? 'パスワードを隠す' : 'パスワードを表示'}
            aria-pressed={isRevealed}
            className='-translate-y-1/2 absolute top-1/2 right-3 text-muted-foreground hover:text-foreground'
            onClick={() => setIsRevealed((prev) => !prev)}
          >
            {isRevealed ? (
              <IconEyeOff className='size-4' />
            ) : (
              <IconEye className='size-4' />
            )}
          </button>
        ) : null}
      </div>
      {field.errors ? (
        <p id={field.errorId} className='text-sm text-red-600' role='alert'>
          {field.errors.join(' / ')}
        </p>
      ) : null}
    </div>
  );
}
