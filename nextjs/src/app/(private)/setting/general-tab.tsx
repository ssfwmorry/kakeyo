'use client';

import Link from 'next/link';
import { useTransition } from 'react';
import { ConfirmDialog } from '@/components/form/confirm-dialog';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { logoutAction } from './logout-action';

// 現状はログアウトのみ。アカウント削除は UI 非表示・Supabase Auth 側の
// 退会フロー未確定のため省略する。

const generalLabels = {
  heading: 'アカウント',
  logout: 'ログアウト',
  logoutConfirm: 'ログアウトしますか？',
  inquiry: 'お問い合わせ'
} as const;

export function GeneralTab() {
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(() => {
      // redirect を投げる Server Action。遷移で画面が離れるため戻り値は扱わない。
      void logoutAction();
    });
  };

  return (
    <section className='flex flex-col gap-3'>
      <h2 className='text-base font-medium'>{generalLabels.heading}</h2>

      <Card>
        <CardContent className='flex flex-col items-start gap-3'>
          <ConfirmDialog
            trigger={
              <Button type='button' variant='destructive' disabled={isPending}>
                {generalLabels.logout}
              </Button>
            }
            title={generalLabels.logoutConfirm}
            confirmLabel={generalLabels.logout}
            onConfirm={handleLogout}
          />
          <Link
            href='/inquiry'
            className={buttonVariants({ variant: 'link', className: 'px-0' })}
          >
            {generalLabels.inquiry}
          </Link>
        </CardContent>
      </Card>
    </section>
  );
}
