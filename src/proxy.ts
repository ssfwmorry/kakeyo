import { type NextRequest, NextResponse } from 'next/server';
import {
  DEMO_SESSION_COOKIE,
  verifyDemoSessionCookie
} from '@/features/auth/server/demoSession';
import { getUserInProxy } from '@/features/auth/server/supabaseProxy';
import { authRoutes } from '@/features/auth/shared/routes';

// 認証ガード。ファイル名は proxy.ts（Next.js 16 で middleware から改名）。
//
// リダイレクト規則:
// - 未ログイン: /login, /inquiry のみ可。それ以外は /login へ
// - ログイン時: /login → /calendar、/（INDEX）→ /calendar
//
// デモ（署名付きデモ Cookie 保持）もログイン済みとして扱う。Cookie が有効なら
// getUserInProxy（Supabase のトークン検証・リフレッシュ）は呼ばない。
//
// Proxy は粗いガード。Server Function は Proxy を経由しない経路がありうるため、
// データ層でも requireAuth で再確認する（多層防御）。

const inquiryPath = '/inquiry';
const publicPaths = new Set<string>([authRoutes.login, inquiryPath]);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // env.server.ts は server-only のため proxy からは import せず、鍵は process.env から渡す。
  const demoMode = await verifyDemoSessionCookie(
    request.cookies.get(DEMO_SESSION_COOKIE)?.value,
    process.env.SESSION_SECRET
  );
  if (demoMode) {
    return routeLoggedIn(request, pathname, NextResponse.next({ request }));
  }

  const { claims, response } = await getUserInProxy(request);
  // undefined を誤ってログイン扱いしないよう != null で null/undefined 両方を弾く。
  const isLoggedIn = claims != null;

  if (!isLoggedIn) {
    if (publicPaths.has(pathname)) {
      return response;
    }
    return redirectTo(request, authRoutes.login);
  }

  return routeLoggedIn(request, pathname, response);
}

// ログイン済みが login / ルートに来たらどちらもカレンダーへ。それ以外は通す。
function routeLoggedIn(
  request: NextRequest,
  pathname: string,
  response: NextResponse
) {
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
