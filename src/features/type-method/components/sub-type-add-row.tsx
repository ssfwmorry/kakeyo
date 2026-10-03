'use client';

import { getFormProps, useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod/v4';
import { cn } from 'cn';
import { useEffect, useState } from 'react';
import { useFormAction } from '@/components/form/use-form-action';
import { IconPlus } from '@/components/icons';
import { Spinner } from '@/components/ui/spinner';
import { upsertSubTypeAction } from '@/features/type-method/actions';
import { subTypeUpsertSchema } from '@/features/type-method/schemas';

// サブカテゴリを追加する行。カテゴリのシートのサブカテゴリ一覧の最後に置く
// （デザイン基礎 SetTypeEdit）。
//
// 名前 1 つだけなのでシートを挟まず、その場で打って右端の「追加」で送る。
// Enter では送らずキーボードを閉じるだけにする（打ち終わりのつもりの Enter で保存されるのを避ける）。

export function SubTypeAddRow({
  typeId,
  hasDivider
}: {
  typeId: number;
  // 上にサブカテゴリの行があるときだけ区切り線を引く。
  hasDivider: boolean;
}) {
  const [result, action, isPending] = useFormAction(upsertSubTypeAction);
  const [form, fields] = useForm({
    lastResult: result?.submission,
    onValidate: ({ formData }) =>
      parseWithZod(formData, { schema: subTypeUpsertSchema })
  });
  const [name, setName] = useState('');
  const canAdd = name.trim() !== '';

  // 続けて何件も足せるよう、追加できてもフォームは残して入力欄だけ空に戻す。
  useEffect(() => {
    if (result?.toast?.type === 'success') {
      setName('');
    }
  }, [result]);

  return (
    <form {...getFormProps(form)} action={action}>
      <input name='typeId' readOnly type='hidden' value={typeId} />
      <div
        className={cn(
          'ml-3.5 flex h-12 items-center gap-3 pr-2',
          hasDivider && 'border-t'
        )}
      >
        <span
          aria-hidden='true'
          className='flex size-5.5 shrink-0 items-center justify-center rounded-full bg-[var(--tile-green)] text-white'
        >
          <IconPlus className='size-3' strokeWidth={3} />
        </span>
        <input
          aria-label='サブカテゴリの名前'
          className='min-w-0 flex-grow bg-transparent text-base text-foreground outline-none'
          enterKeyHint='done'
          key={fields.name.key}
          maxLength={10}
          name={fields.name.name}
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              event.currentTarget.blur();
            }
          }}
          placeholder='サブカテゴリを追加'
          type='text'
          value={name}
        />
        <button
          className={cn(
            'flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-lg px-3 font-bold text-[13px]',
            canAdd
              ? 'bg-primary text-primary-foreground'
              : 'bg-disabled text-muted-foreground'
          )}
          disabled={!canAdd || isPending}
          type='submit'
        >
          {isPending ? <Spinner className='size-3.5' /> : null}
          追加
        </button>
      </div>
    </form>
  );
}
