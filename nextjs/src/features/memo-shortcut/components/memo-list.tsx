'use client';

import { getFormProps, useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod/v4';
import { useEffect, useRef } from 'react';
import { FormField } from '@/components/form/form-field';
import { useFormAction } from '@/components/form/use-form-action';
import { Button } from '@/components/ui/button';
import { L } from '@/lib/shared/labels';
import { deleteMemoAction, insertMemoAction } from '../actions';
import { memoShortcutLabels } from '../labels';
import { memoFormSchema } from '../schemas/memo-schema';
import type { MemoItem } from '../types';

// L8 TODO（memo）一覧 + 追加 + 削除の Client Component。
// bank の各フォームを手本に「1 フォーム = 1 スキーマ = 1 useForm」。
// データ（items）は Server Component（calendar 統合レーン P5）から props で受ける。
// hasPair=false のときは「ペアと共有」チェックを出さない（共有 TODO を作れない）。
// 追加成功後は revalidatePath('/calendar') で items が更新されるため、フォームを
// リセットして次の入力に備える。

type MemoListProps = {
  items: MemoItem[];
  // ペアが設定済みか。未設定なら共有チェックを出さない。
  hasPair: boolean;
};

export function MemoList({ items, hasPair }: MemoListProps) {
  const [result, action] = useFormAction(insertMemoAction);
  const formRef = useRef<HTMLFormElement>(null);
  const [form, fields] = useForm({
    lastResult: result?.submission,
    onValidate: ({ formData }) =>
      parseWithZod(formData, { schema: memoFormSchema })
  });

  // 追加成功でフォームをクリア（連続入力しやすく）。
  useEffect(() => {
    if (result?.toast?.type === 'success') {
      formRef.current?.reset();
    }
  }, [result]);

  return (
    <section className='flex flex-col gap-4'>
      <h2 className='font-bold text-lg'>{memoShortcutLabels.heading.todo}</h2>

      <form
        {...getFormProps(form)}
        ref={formRef}
        action={action}
        className='flex flex-col gap-2'
      >
        <FormField
          label={memoShortcutLabels.heading.todo}
          field={fields.memo}
          placeholder={memoShortcutLabels.placeholder.todo}
        />
        {hasPair ? (
          <label className='flex items-center gap-2 text-sm'>
            <input type='checkbox' name='isPair' value='on' />
            {memoShortcutLabels.action.sharePair}
          </label>
        ) : null}
        <Button type='submit'>{memoShortcutLabels.action.add}</Button>
      </form>

      {items.length === 0 ? (
        <p className='text-muted-foreground text-sm'>
          {memoShortcutLabels.empty.todo}
        </p>
      ) : (
        <ul className='flex flex-col gap-2'>
          {items.map((item) => (
            <MemoRow key={item.id} item={item} />
          ))}
        </ul>
      )}
    </section>
  );
}

// 1 件の TODO 行（削除は行ごとの独立フォーム = deleteMemoAction）。
function MemoRow({ item }: { item: MemoItem }) {
  const [, deleteAction] = useFormAction(deleteMemoAction);
  return (
    <li className='flex items-center justify-between gap-2 rounded-md border px-3 py-2'>
      <span className='flex items-center gap-2'>
        {item.isPair ? (
          <span className='rounded bg-muted px-1.5 py-0.5 text-muted-foreground text-xs'>
            {memoShortcutLabels.action.sharePair}
          </span>
        ) : null}
        {item.memo}
      </span>
      <form action={deleteAction}>
        <input type='hidden' name='id' value={item.id} readOnly />
        <Button
          type='submit'
          variant='ghost'
          size='sm'
          aria-label={memoShortcutLabels.action.removeTodo}
        >
          {L.button.delete}
        </Button>
      </form>
    </li>
  );
}
