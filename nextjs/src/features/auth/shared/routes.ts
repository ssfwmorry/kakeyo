// 認証フローのリダイレクト先パス（凍結資産）。
// proxy.ts / requireAuth.ts / login actions が参照する単一の正。
// proxy は共有モジュール依存を避けるべきだが、副作用ゼロの定数のみのため import 可。

export const authRoutes = {
  login: '/login',
  // TODO(別チケット): /note は未実装のため現状デモ/通常ログイン後に 404 になる。
  // /note 実装時にこのまま有効化。それまでの暫定遷移先が要るなら /bank 等へ差し替える。
  afterLogin: '/note',
  // TODO(別チケット): /calendar も未実装（app 配下にルートなし）。実装時に有効化。
  // ログイン済みでルート（/）に来たときのホーム。
  home: '/calendar'
} as const;
