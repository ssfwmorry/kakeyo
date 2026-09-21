'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { FLASH_COOKIE } from '@/lib/shared/toast/flashCookie';
import { type ToastMessage, ToastType } from '@/lib/shared/types/formResult';

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
  // 読めたら即削除（1 回きり・二重発火防止）。flash は消費が目的の短命 Cookie で、
  // 単発削除に Cookie Store API はオーバースペックのため直接代入で消す。
  // biome-ignore lint/suspicious/noDocumentCookie: 消費即削除の一点用途。
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

  // pathname 自体は effect 内で使わないが、「遷移のたびに flash を確認する」ため
  // あえて依存に残す（除去すると初回のみになり redirect 後の通知を取りこぼす）。
  // biome-ignore lint/correctness/useExhaustiveDependencies: 遷移検知のトリガとして意図的。
  useEffect(() => {
    const flash = readAndClearFlash();
    if (flash) {
      toast[flash.type](flash.message);
    }
  }, [pathname]);

  return null;
}
