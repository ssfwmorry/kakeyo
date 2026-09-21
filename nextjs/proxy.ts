import { type NextRequest, NextResponse } from 'next/server';
import { getUserInProxy } from '@/lib/server/auth/supabaseProxy';
import { authRoutes } from '@/lib/shared/auth/routes';

// 認証ガード（凍結資産）。ファイル名は proxy.ts（Next.js 16 で middleware から改名）。
//
// リダイレクト規則:
// - 未ログイン: /login, /inquiry のみ可。それ以外は /login へ
// - ログイン時: /login → /note、/（INDEX）→ /calendar
//
// Proxy は粗いガード。Server Function は Proxy を経由しない経路がありうるため、
// データ層でも requireAuth で再確認する（多層防御）。

const inquiryPath = '/inquiry';
const publicPaths = new Set<string>([authRoutes.login, inquiryPath]);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { user, response } = await getUserInProxy(request);
  // undefined を誤ってログイン扱いしないよう != null で null/undefined 両方を弾く。
  const isLoggedIn = user != null;

  if (!isLoggedIn) {
    if (publicPaths.has(pathname)) {
      return response;
    }
    return redirectTo(request, authRoutes.login);
  }

  // ログイン済みが login に来たら note、ルートに来たら calendar へ。
  if (pathname === authRoutes.login) {
    return redirectTo(request, authRoutes.afterLogin);
  }
  if (pathname === '/') {
    return redirectTo(request, authRoutes.home);
  }

  return response;
}

function redirectTo(request: NextRequest, path: string) {
  const url = request.nextUrl.clone();
  url.pathname = path;
  return NextResponse.redirect(url);
}

export const config = {
  // 静的アセット・API・画像最適化・メタデータは除外。
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'
  ]
};
