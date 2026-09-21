import { cookies } from 'next/headers';
import { FLASH_COOKIE } from '@/lib/toast/flashCookie';
import type { ToastMessage } from '@/lib/types/formResult';

// ページ遷移をまたぐトースト（flash message）の書き込み側。
// Server Action が redirect する場合、戻り値の FormActionResult は
// クライアントに届かず useFormToast では発火できない。そこで redirect の前に
// 通知内容を短命 Cookie に書き、遷移先で FlashToast が消費・発火する。
//
// 遷移せず結果を返せるフォームは従来どおり FormActionResult.toast を使い、
// flash は「redirect を挟む通知」専用とする（二重発火を避けるため使い分ける）。

// redirect する Server Action の中で、redirect() を呼ぶ直前に使う。
export async function setFlashToast(toast: ToastMessage): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(FLASH_COOKIE, JSON.stringify(toast), {
    // 遷移完了までの短命で十分。遷移先で消費し即削除する。
    maxAge: 30,
    path: '/',
    sameSite: 'lax',
    // クライアントで読んで消費するため httpOnly は付けない。
    httpOnly: false
  });
}
