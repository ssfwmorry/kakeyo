'use client';

import { getFormProps, getInputProps, useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod/v4';
import { useEffect, useRef } from 'react';
import { useFormAction } from '@/components/form/use-form-action';
import { IconPlus } from '@/components/icons';
import { upsertSubTypeAction } from '@/features/type-method/actions';
import { subTypeUpsertSchema } from '@/features/type-method/schemas';

// サブカテゴリを追加する行。カテゴリ編集画面のリストの最後に置く
// （デザイン基礎 SetTypeEdit）。
//
// 名前 1 つだけなのでシートを挟まず、その場で打って Enter で追加する。
// 追加後は入力欄を空にして、続けて打てるようにする。

export function SubTypeAddRow({
  typeId,
  hasDivider
}: {
  typeId: number;
  // 上にサブカテゴリの行があるときだけ区切り線を引く。
  hasDivider: boolean;
}) {
  const [result, action] = useFormAction(upsertSubTypeAction);
  const [form, fields] = useForm({
    lastResult: result?.submission,
    onValidate: ({ formData }) =>
      parseWithZod(formData, { schema: subTypeUpsertSchema })
  });
  const inputRef = useRef<HTMLInputElement>(null);

  // 追加できたら入力欄を空に戻す。続けて何件も足せるようにするため、
  // フォーム自体はそのまま残す。
  useEffect(() => {
    if (result?.toast?.type === 'success' && inputRef.current !== null) {
      inputRef.current.value = '';
    }
  }, [result]);

  return (
    <form {...getFormProps(form)} action={action}>
      <input name='typeId' readOnly type='hidden' value={typeId} />
      <label
        className={`flex h-12 items-center gap-3 px-3.5 ${hasDivider ? 'border-t' : ''}`}
      >
        <span
          aria-hidden='true'
          className='flex size-5.5 shrink-0 items-center justify-center rounded-full bg-[var(--cat-green)] text-[var(--cat-on)]'
        >
          <IconPlus className='size-3' strokeWidth={3} />
        </span>
        <input
          {...getInputProps(fields.name, { type: 'text' })}
          className='min-w-0 flex-grow bg-transparent text-base text-foreground outline-none'
          key={fields.name.key}
          placeholder='サブカテゴリを追加'
          ref={inputRef}
        />
      </label>
    </form>
  );
}
