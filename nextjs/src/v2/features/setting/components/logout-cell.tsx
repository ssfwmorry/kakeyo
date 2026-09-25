'use client';

import { type ReactNode, useTransition } from 'react';
import { logoutAction } from '@/app/(private)/setting/logout-action';
import { ConfirmDialog } from '@/components/form/confirm-dialog';
import { ListCellButton } from '@/v2/components/list-cell';

// 設定「その他」末尾のログアウト行。
//
// 行そのものが操作なので ListCellButton にし、確認は共通の ConfirmDialog に任せる
// （旧 GeneralTab と同じ流れ。Server Action は既存の logoutAction をそのまま使う）。
// 設定トップは Server Component なので、useTransition を持つこの行だけを切り出す。

const labels = {
  logout: 'ログアウト',
  confirm: 'ログアウトしますか？'
} as const;

export function LogoutCell({ leading }: { leading: ReactNode }) {
  const [isPending, startTransition] = useTransition();

  const logout = () => {
    startTransition(() => {
      // redirect を投げる Server Action。遷移で画面が離れるため戻り値は扱わない。
      void logoutAction();
    });
  };

  return (
    <ConfirmDialog
      confirmLabel={labels.logout}
      onConfirm={logout}
      size='sm'
      solidConfirm
      title={labels.confirm}
      trigger={
        <ListCellButton
          className='text-destructive disabled:opacity-50'
          disabled={isPending}
          label={labels.logout}
          leading={leading}
          trailing={null}
        />
      }
    />
  );
}
