'use client';

import type { ReactElement } from 'react';
import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { L } from '@/lib/shared/labels';

// 削除などの取り返しがつかない操作の確認ダイアログ（全 feature 共通）。
//
// window.confirm は OS 依存の見た目でアプリの質感から浮き、文言も装飾できないため
// 使わない。全て shadcn の AlertDialog に寄せる。
//
// trigger には「押すと確認したい」ボタンを render prop で渡す。確認されたときだけ
// onConfirm が走る（キャンセルは何もしない）。

type ConfirmDialogProps = {
  // 確認を起動する要素（アイコンボタン等）。AlertDialogTrigger が render で
  // 差し替えるため、単一の要素であることが要る。
  trigger: ReactElement;
  title: string;
  description?: string;
  // 実行ボタンの文言。既定は「削除」。
  confirmLabel?: string;
  // 本文を持つ確認は 'sm'（2 列フッタ）に寄せる。
  size?: 'default' | 'sm';
  // ダイアログの中では削除が主操作なので塗りつぶす。共通の destructive は淡い塗り
  // （画面上では副次操作）なので、主操作として見せたいときだけ実体の赤を当てる。
  solidConfirm?: boolean;
  onConfirm: () => void;
};

export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel = L.button.delete,
  size = 'default',
  solidConfirm = false,
  onConfirm
}: ConfirmDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger render={trigger} />
      <AlertDialogContent size={size}>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description ? (
            <AlertDialogDescription>{description}</AlertDialogDescription>
          ) : null}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{L.button.cancel}</AlertDialogCancel>
          <AlertDialogAction
            variant='destructive'
            className={
              solidConfirm
                ? 'bg-destructive text-white hover:bg-destructive/90'
                : undefined
            }
            onClick={() => {
              setOpen(false);
              onConfirm();
            }}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
