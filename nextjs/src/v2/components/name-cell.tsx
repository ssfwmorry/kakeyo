'use client';

import type { ReactNode } from 'react';
import { InitialCircle } from '@/v2/components/initial-circle';
import {
  ListCellButton,
  ListCellLink,
  ListCellStatic
} from '@/v2/components/list-cell';

// カテゴリ・方法の 1 行。色の丸 + 名前で、押すと編集（シートまたは編集画面）が開く。
//
// 編集モードでは行そのものは押せなくなり、右端の並べ替えハンドルだけが操作対象になる。
// 行をボタンやリンクのままハンドルを中に置くと、操作が入れ子になって
// どちらが反応するか決まらないため。
//
// デザインでは行頭にも削除マーク（赤い −）が出るが、削除は編集シート・編集画面の
// 末尾に一本化している。同じ操作の入口を 2 つ持つと、「どちらが確認つきか」が
// 見た目から分からなくなるため。

type NameCellProps = {
  name: string;
  colorName: string;
  // カテゴリのサブカテゴリ一覧など、名前の下に出す補足。
  description?: string;
  isEditing: boolean;
  isFirst: boolean;
  // 編集モードで右端に出す並べ替えハンドル。
  handle?: ReactNode;
};

export function NameCell(
  props: NameCellProps &
    // シートを開く行はハンドラ、編集画面へ進む行はリンク先を持つ。
    ({ onOpen: () => void; href?: never } | { href: string; onOpen?: never })
) {
  const { name, colorName, description, isEditing, isFirst, handle } = props;

  const shared = {
    description,
    height: 52 as const,
    isFirst,
    label: name,
    leading: <InitialCircle colorName={colorName} name={name} />
  };

  if (isEditing) {
    // ハンドルが無い行も既定のシェブロンに戻さない（進める行に見せない）。
    return <ListCellStatic {...shared} trailing={handle ?? null} />;
  }

  return props.href === undefined ? (
    <ListCellButton {...shared} onClick={props.onOpen} />
  ) : (
    <ListCellLink {...shared} href={props.href} />
  );
}
