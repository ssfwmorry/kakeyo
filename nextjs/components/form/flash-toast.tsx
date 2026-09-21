'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { FLASH_COOKIE } from '@/lib/toast/flashCookie';
import { type ToastMessage, ToastType } from '@/lib/types/formResult';

// ページ遷移をまたぐトースト（flash message）の消費側。
// ルートレイアウトに常設し、遷移のたびに flash Cookie を読んで発火・即削除する。
// 消費（削除）をクライアントで行うのは、App Router では Server Component の
// レンダリング中に Cookie を変更できないため。

const isToastType = (v: string): v is ToastType =>
  Object.values(ToastType).includes(v as ToastType);

function readAndClearFlash(): ToastMessage | null {
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${FLASH_COOKIE}=`));
  if (!match) {
    return null;
  }
  // 読めたら即削除（1 回きり・二重発火防止）。
  document.cookie = `${FLASH_COOKIE}=; Max-Age=0; path=/`;

  try {
    const parsed = JSON.parse(
      decodeURIComponent(match.slice(FLASH_COOKIE.length + 1))
    ) as ToastMessage;
    if (!parsed?.message || !isToastType(parsed.type)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function FlashToast() {
  const pathname = usePathname();

  // pathname を deps に入れ、遷移のたびに flash を確認する。
  useEffect(() => {
    const flash = readAndClearFlash();
    if (flash) {
      toast[flash.type](flash.message);
    }
  }, [pathname]);

  return null;
}
