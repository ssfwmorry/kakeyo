'use client';

import { getFormProps, getInputProps, useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod/v4';
import { useEffect, useRef, useState } from 'react';
import { useFormAction } from '@/components/form/use-form-action';
import { IconClose, IconShare } from '@/components/icons';
import { Input } from '@/components/ui/input';
import { deleteMemoAction, insertMemoAction } from '../actions';
import { memoShortcutLabels } from '../labels';
import { memoFormSchema } from '../schemas/memo-schema';
import type { MemoItem } from '../types';

// TODO（memo）一覧 + 追加 + 削除の Client Component。
// データ（items）は Server Component から props で受ける。
// hasPair=false のときは「ペアと共有」チェックを出さない（共有 TODO を作れない）。
//
// カレンダー画面は縦がきつい（1 画面に月グリッド・記録・TODO・ショートカットが載る）。
// そのため TODO は「1 件 = 1 カード行」ではなく chip の帯にして折り返し、常時開いていた
// 追加フォームも「＋ TODO を追加」chip を押したときだけ開く。見出しは持たない
// （この chip が帯の名乗りを兼ねる。0 件でも同じ chip だけが並ぶ）。
// 追加成功後は revalidatePath('/calendar') で items が更新されるため、フォームを
// 閉じて次の入力に備える。

type MemoListProps = {
  items: MemoItem[];
  // ペアが設定済みか。未設定なら共有チェックを出さない。
  hasPair: boolean;
};

export function MemoList({ items, hasPair }: MemoListProps) {
  // 追加フォームの開閉。既定は閉（帯の高さを TODO の件数だけで決める）。
  const [isAdding, setIsAdding] = useState(false);

  return (
    <div className='flex flex-wrap items-center gap-1.5'>
      {items.map((item) => (
        <MemoChip key={item.id} item={item} />
      ))}

      {isAdding ? (
        <MemoAddForm hasPair={hasPair} onClose={() => setIsAdding(false)} />
      ) : (
        <button
          type='button'
          onClick={() => setIsAdding(true)}
          className='inline-flex h-7 items-center gap-1 rounded-full border border-dashed px-2.5 text-muted-foreground text-xs hover:border-solid hover:text-foreground'
        >
          ＋ {memoShortcutLabels.action.addTodo}
        </button>
      )}
    </div>
  );
}

// TODO 1 件の chip（削除は chip 内の × = 行ごとの独立フォーム）。
// 共有 TODO は文字ラベルではなく枠色 + IconShare で示す（chip 内にもう 1 つ
// バッジを入れると帯が二重に膨らむ）。アイコンは共通定義の IconShare だけを使う。
function MemoChip({ item }: { item: MemoItem }) {
  const [, deleteAction] = useFormAction(deleteMemoAction);
  return (
    <span
      className={
        item.isPair
          ? 'inline-flex h-7 max-w-full items-center gap-1 rounded-full border border-primary bg-primary/5 pr-0.5 pl-2.5 text-xs'
          : 'inline-flex h-7 max-w-full items-center gap-1 rounded-full border bg-secondary pr-0.5 pl-2.5 text-xs'
      }
    >
      {item.isPair ? (
        <IconShare
          className='size-3 shrink-0 text-primary'
          aria-label={memoShortcutLabels.action.sharePair}
        />
      ) : null}
      <span className='truncate'>{item.memo}</span>
      <form action={deleteAction} className='flex'>
        <input type='hidden' name='id' value={item.id} readOnly />
        <button
          type='submit'
          aria-label={`${item.memo} を削除`}
          className='inline-flex size-6 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-background hover:text-foreground'
        >
          <IconClose className='size-3' />
        </button>
      </form>
    </span>
  );
}

// ＋ chip を押したときにその場で開く 1 行入力。帯の中に収まるよう label は持たず
// placeholder で用を足す（エラーは入力欄の下に出す）。
// Escape と空のまま blur で閉じ、追加が通ったら閉じる。
function MemoAddForm({
  hasPair,
  onClose
}: {
  hasPair: boolean;
  onClose: () => void;
}) {
  const [result, action] = useFormAction(insertMemoAction);
  const inputRef = useRef<HTMLInputElement>(null);
  const [form, fields] = useForm({
    lastResult: result?.submission,
    onValidate: ({ formData }) =>
      parseWithZod(formData, { schema: memoFormSchema })
  });

  // 開いたら即入力できるようにフォーカスする。
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // 追加成功で閉じる（items は revalidate で chip に反映される）。
  useEffect(() => {
    if (result?.toast?.type === 'success') {
      onClose();
    }
  }, [result, onClose]);

  return (
    <form
      {...getFormProps(form)}
      action={action}
      className='flex w-full flex-col gap-1'
    >
      <div className='flex items-center gap-1.5'>
        {/* id/name/aria-* の配線は他フォーム（FormField）と同じく getInputProps に任せる。 */}
        <Input
          {...getInputProps(fields.memo, { type: 'text' })}
          ref={inputRef}
          key={fields.memo.key}
          placeholder={memoShortcutLabels.placeholder.todo}
          className='h-8 flex-1 text-sm'
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              onClose();
            }
          }}
        />
        {hasPair ? (
          <label className='inline-flex h-8 shrink-0 items-center gap-1 rounded-md border px-2 text-muted-foreground text-xs has-checked:border-primary has-checked:text-primary'>
            <input
              type='checkbox'
              name='isPair'
              value='on'
              className='size-3'
            />
            <IconShare className='size-3' />
            {memoShortcutLabels.action.sharePair}
          </label>
        ) : null}
        <button
          type='submit'
          className='inline-flex h-8 shrink-0 items-center rounded-md bg-primary px-3 font-medium text-primary-foreground text-xs'
        >
          {memoShortcutLabels.action.add}
        </button>
        <button
          type='button'
          onClick={onClose}
          aria-label={memoShortcutLabels.action.cancelAdd}
          className='inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:text-foreground'
        >
          <IconClose className='size-4' />
        </button>
      </div>
      {fields.memo.errors ? (
        <p
          id={fields.memo.errorId}
          className='text-red-600 text-xs'
          role='alert'
        >
          {fields.memo.errors.join(' / ')}
        </p>
      ) : null}
    </form>
  );
}
