// 認証フローのリダイレクト先パス（凍結資産）。
// proxy.ts / requireAuth.ts / login actions が参照する単一の正。
// proxy は共有モジュール依存を避けるべきだが、副作用ゼロの定数のみのため import 可。

export const authRoutes = {
  login: '/login',
  afterLogin: '/note',
  // ログイン済みでルート（/）に来たときのホーム。
  home: '/calendar'
} as const;
