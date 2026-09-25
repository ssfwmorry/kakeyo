'use client';

import { usePathname } from 'next/navigation';
import { Toaster } from '@/components/ui/sonner';

// 旧画面用のトースト（画面下中央）。新デザイン（/v2）は自分の Toaster を持つので、
// 同じ通知が二重に出ないよう v2 配下では描画しない。全画面の移行が済んだら
// この分岐ごと撤去する。
export function LegacyToaster() {
  const pathname = usePathname();
  if (pathname.startsWith('/v2')) {
    return null;
  }
  return <Toaster position='bottom-center' />;
}
