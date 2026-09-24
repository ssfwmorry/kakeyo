// 認証フローのリダイレクト先パス。
// proxy.ts / requireAuth.ts / login actions が参照する単一の正。
// proxy は共有モジュール依存を避けるべきだが、副作用ゼロの定数のみのため import 可。

export const authRoutes = {
  login: '/login',
  // ログイン直後も、ルート（/）到達時も、まず「今月どうなっているか」を見せたいので
  // どちらもカレンダーに着地させる（入力はそこから選ぶ）。
  afterLogin: '/calendar',
  home: '/calendar'
} as const;
