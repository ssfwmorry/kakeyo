'use client';

import { type ReactNode, useState, useTransition } from 'react';
import { ListCellButton } from '@/components/list-cell';
import { ConfirmAlert } from '@/components/ui/confirm-alert';
import { logoutAction } from '@/features/auth/actions/logout-action';

// 設定「その他」末尾のログアウト行。
//
// 行そのものが操作なので ListCellButton にし、確認は ConfirmAlert に任せる
// （Server Action は既存の logoutAction をそのまま使う）。
// 設定トップは Server Component なので、useTransition を持つこの行だけを切り出す。

const labels = {
  logout: 'ログアウト',
  confirm: 'ログアウトしますか？'
} as const;

export function LogoutCell({ leading }: { leading: ReactNode }) {
  const [isPending, startTransition] = useTransition();
  const [isConfirming, setIsConfirming] = useState(false);

  const logout = () => {
    setIsConfirming(false);
    startTransition(() => {
      // redirect を投げる Server Action。遷移で画面が離れるため戻り値は扱わない。
      void logoutAction();
    });
  };

  return (
    <>
      <ListCellButton
        className='text-destructive disabled:opacity-50'
        disabled={isPending}
        label={labels.logout}
        leading={leading}
        onClick={() => setIsConfirming(true)}
      />
      <ConfirmAlert
        confirmLabel={labels.logout}
        onCancel={() => setIsConfirming(false)}
        onConfirm={logout}
        open={isConfirming}
        pending={isPending}
        title={labels.confirm}
      />
    </>
  );
}
