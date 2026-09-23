'use client';

import { colorHex } from '@/features/master';
import { formatShortcutAmount } from '../domain/format';
import { memoShortcutLabels } from '../labels';
import type { ShortCutItem } from '../types';

// ショートカット一覧の Client Component（表示 + ワンタップ選択）。
// データ（items）は Server Component から props で受ける。
// ショートカットからの記録は record ドメインの upsertRecord で行う。
// ショートカットは record を所有しないため、ここでは記録処理を持たず onSelect コールバックで
// 選択されたショートカットを親（calendar 統合）へ渡す設計にする。
// onSelect 未指定なら選択ボタンを出さない（純表示）。
//
// 見た目は: 左端に種別色の帯を立て、2 カラムで
// 並べる（1 カラムの色ドット行だと画面が縦に伸び、色の手がかりも弱い）。
// カード全体がワンタップ記録のボタンになる（onSelect あり時）。

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
        <ul className='grid grid-cols-2 gap-2'>
          {items.map((item) => (
            <li key={item.id}>
              <ShortcutCard item={item} onSelect={onSelect} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// ショートカット 1 件のカード（左端に種別色の帯）。onSelect があればカードごと
// ボタンにして 1 タップで記録する。
function ShortcutCard({
  item,
  onSelect
}: {
  item: ShortCutItem;
  onSelect?: (item: ShortCutItem) => void;
}) {
  const body = (
    <>
      <span
        aria-hidden='true'
        className='w-1.5 shrink-0 rounded-l-md'
        style={{ backgroundColor: colorHex(item.colorName) }}
      />
      <span className='flex min-w-0 flex-1 flex-col gap-0.5 py-2 pr-2 pl-1.5 text-left'>
        <span className='truncate text-sm'>
          {item.typeName}
          {item.subTypeName ? ` / ${item.subTypeName}` : ''}
        </span>
        <span className='truncate text-muted-foreground text-xs'>
          {item.methodName}
          {item.memo ? ` · ${item.memo}` : ''}
        </span>
        <span className='text-right font-medium text-sm'>
          {formatShortcutAmount(item.price, item.isPay)}
        </span>
      </span>
    </>
  );

  const className = 'flex w-full items-stretch rounded-md border';

  return onSelect ? (
    <button
      type='button'
      className={className}
      aria-label={`${item.typeName} を${memoShortcutLabels.action.add}`}
      onClick={() => onSelect(item)}
    >
      {body}
    </button>
  ) : (
    <div className={className}>{body}</div>
  );
}
