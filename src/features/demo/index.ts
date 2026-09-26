// demo feature の公開 API（barrel）。
// デモは「Supabase Auth・DB に一切触れない純フロントセッション」。この feature が
//   - shared/mode.ts      : DemoMode と固定セッション値（Client / proxy / server 共有）
//   - server/inject.ts    : サービス層の注入ヘルパ（withDemoRead / withDemoWriteVoid）
//   - server/dataset/*    : 正規化したデモデータ（実 DB のテーブル構成を写した小さな DB）
//   - server/queries/*    : dataset を各 feature の DTO へ射影する関数（実リポジトリと同名）
// を持つ。署名付きデモ Cookie の発行・検証は認証基盤のため auth feature に残している。
//
// server-only を含むモジュール（server/*）は re-export しない。各 feature のサービス層は
// @/features/demo/server/inject と @/features/demo/server/queries/<feature> を直接 import する。

export {
  DEMO_PAIR_ID,
  DEMO_USER_EMAIL,
  DEMO_USER_UID,
  DemoMode,
  isDemoMode
} from './shared/mode';
