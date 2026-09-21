// auth feature の公開 API（barrel）。
// feature 外（app / proxy / 他 feature）はこの index 経由で参照し、
// feature 内部の具体的なファイル構成（server/components/actions…）には依存しない。
// server-only を含むモジュールはここから re-export しない（FE から誤 import されるため）。
// requireAuth 等のサーバ専用関数は各利用箇所が @/features/auth/server/* を直接 import する。

export { LoginForm } from './components/login-form';
