'use client';

import { Button } from '@/components/ui/button';
import { colorHex } from '@/features/master';
import { formatShortcutAmount } from '../domain/format';
import { memoShortcutLabels } from '../labels';
import type { ShortCutItem } from '../types';

// L8 ショートカット一覧の Client Component（表示 + ワンタップ選択）。
// データ（items）は Server Component（calendar 統合レーン P5）から props で受ける。
// ★ ショートカットからの記録は record ドメインの upsertRecord で行う（be-api.md）。
//   L8 は record を所有しないため、ここでは記録処理を持たず onSelect コールバックで
//   選択されたショートカットを親（P5 の calendar 統合）へ渡す設計にする。
//   onSelect 未指定なら選択ボタンを出さない（純表示）。

type ShortcutListProps = {
  items: ShortCutItem[];
  // ワンタップ記録用。選択されたショートカットを親へ渡す（record 登録は親の責務）。
  onSelect?: (item: ShortCutItem) => void;
};

export function ShortcutList({ items, onSelect }: ShortcutListProps) {
  return (
    <section className='flex flex-col gap-4'>
      <h2 className='font-bold text-lg'>
        {memoShortcutLabels.heading.shortcut}
      </h2>

      {items.length === 0 ? (
        <p className='text-muted-foreground text-sm'>
          {memoShortcutLabels.empty.shortcut}
        </p>
      ) : (
        <ul className='flex flex-col gap-2'>
          {items.map((item) => (
            <li
              key={item.id}
              className='flex items-center justify-between gap-2 rounded-md border px-3 py-2'
            >
              <span className='flex items-center gap-2'>
                <span
                  aria-hidden='true'
                  className='inline-block size-3 shrink-0 rounded-full'
                  style={{ backgroundColor: colorHex(item.colorName) }}
                />
                <span className='flex flex-col'>
                  <span className='text-sm'>
                    {item.typeName}
                    {item.subTypeName ? ` / ${item.subTypeName}` : ''}
                    {` · ${item.methodName}`}
                  </span>
                  {item.memo ? (
                    <span className='text-muted-foreground text-xs'>
                      {item.memo}
                    </span>
                  ) : null}
                </span>
              </span>
              <span className='flex items-center gap-2'>
                <span className='font-medium text-sm'>
                  {formatShortcutAmount(item.price, item.isPay)}
                </span>
                {onSelect ? (
                  <Button
                    type='button'
                    size='sm'
                    onClick={() => onSelect(item)}
                  >
                    {memoShortcutLabels.action.add}
                  </Button>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
