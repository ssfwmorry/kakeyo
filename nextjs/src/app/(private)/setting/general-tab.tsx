'use client';

import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { logoutAction } from './logout-action';

// 設定「その他」タブ（Nuxt setting.vue の General 相当）。
// 現状はログアウトのみを提供する。アカウント削除（旧 useFirebase.deleteUser）は
// 現行 UI 非表示・Supabase Auth 側の退会フロー未確定のため本移行では省略する。
// TODO(別チケット): アカウント削除の UI と Server Action（Supabase Auth ユーザ削除 +
// 関連データの扱い）を実装する。fe-screens §SETTING の General 参照。

const generalLabels = {
  heading: 'アカウント',
  logout: 'ログアウト',
  logoutConfirm: 'ログアウトしますか？'
} as const;

export function GeneralTab() {
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    if (!window.confirm(generalLabels.logoutConfirm)) {
      return;
    }
    startTransition(() => {
      // redirect を投げる Server Action。遷移で画面が離れるため戻り値は扱わない。
      void logoutAction();
    });
  };

  return (
    <section className='flex flex-col gap-3'>
      <h2 className='text-base font-medium'>{generalLabels.heading}</h2>

      <Card>
        <CardContent>
          <Button
            type='button'
            variant='destructive'
            disabled={isPending}
            onClick={handleLogout}
          >
            {generalLabels.logout}
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}
