'use client';

import { cn } from 'cn';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { RemoveBadge } from '@/components/delete-flow';
import { InitialCircle } from '@/components/initial-circle';
import { ListCellButton, ListCellLink } from '@/components/list-cell';

// カテゴリ・方法・予定カテゴリの 1 行。色の丸 + 名前で、押すと編集（シートまたは編集画面）が開く。
//
// 編集モードでは右端がドラッグハンドルになり、画面によって行頭に削除の −（カテゴリ・方法）が
// 出る。行を押して開けるかも画面ごとに違う（カテゴリ・方法は開ける、予定カテゴリは開けない）。
// 編集モードの行はボタンやリンクそのものにはしない。中にハンドルと − が入るので、
// 押せる範囲を名前の部分だけに絞る（操作の入れ子を避ける）。

type NameCellProps = {
  name: string;
  colorName: string;
  // カテゴリのサブカテゴリ一覧など、名前の下に出す補足。
  description?: string;
  isEditing: boolean;
  isFirst: boolean;
  // 編集モードで右端に出す並べ替えハンドル。
  handle?: ReactNode;
  // 編集モードで行頭に出す削除。省略すると出さない。
  onRemove?: () => void;
  // 編集モードでも名前を押して開けるか。
  isOpenableWhileEditing?: boolean;
  // 行（ボタン・リンク）のアクセシブルネーム。省略すると名前がそのまま読まれる。
  ariaLabel?: string;
};

type Opener =
  // シートを開く行はハンドラ、編集画面へ進む行はリンク先を持つ。
  { onOpen: () => void; href?: never } | { href: string; onOpen?: never };

export function NameCell(props: NameCellProps & Opener) {
  const { name, colorName, description, isEditing, isFirst, ariaLabel } = props;

  if (isEditing) {
    return <EditingRow {...props} />;
  }

  const shared = {
    description,
    height: 52 as const,
    isFirst,
    label: name,
    leading: <InitialCircle colorName={colorName} name={name} />
  };

  return props.href === undefined ? (
    <ListCellButton {...shared} aria-label={ariaLabel} onClick={props.onOpen} />
  ) : (
    <ListCellLink {...shared} href={props.href} />
  );
}

function EditingRow({
  name,
  colorName,
  description,
  isFirst,
  handle,
  onRemove,
  isOpenableWhileEditing = false,
  ariaLabel,
  ...opener
}: NameCellProps & Opener) {
  return (
    <div className='flex h-13 items-center gap-3 px-3.5 text-foreground'>
      {onRemove === undefined ? null : <RemoveBadge onClick={onRemove} />}
      <InitialCircle colorName={colorName} name={name} />
      {/* 区切り線は丸の右から。ハンドルの下まで通す。 */}
      <span
        className={cn(
          'flex min-w-0 flex-grow items-center gap-2 self-stretch',
          !isFirst && 'border-t'
        )}
      >
        <NameBody
          ariaLabel={ariaLabel}
          description={description}
          isOpenable={isOpenableWhileEditing}
          name={name}
          opener={opener}
        />
        {handle}
      </span>
    </div>
  );
}

const BODY_CLASS =
  'flex min-w-0 flex-grow items-center self-stretch text-left text-foreground';

function NameBody({
  name,
  description,
  isOpenable,
  ariaLabel,
  opener
}: {
  name: string;
  description?: string;
  isOpenable: boolean;
  ariaLabel?: string;
  opener: Opener;
}) {
  const text = (
    <span className='flex min-w-0 flex-grow flex-col gap-px'>
      <span className='truncate text-base'>{name}</span>
      {description !== undefined ? (
        <span className='truncate text-muted-foreground text-xs'>
          {description}
        </span>
      ) : null}
    </span>
  );
  if (!isOpenable) {
    return <span className={BODY_CLASS}>{text}</span>;
  }
  if (opener.href !== undefined) {
    return (
      <Link aria-label={ariaLabel} className={BODY_CLASS} href={opener.href}>
        {text}
      </Link>
    );
  }
  return (
    <button
      aria-label={ariaLabel}
      className={BODY_CLASS}
      onClick={opener.onOpen}
      type='button'
    >
      {text}
    </button>
  );
}
