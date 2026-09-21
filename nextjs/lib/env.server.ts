import 'server-only';

// サーバ専用の環境変数（凍結資産）。DB URL / セッション秘密鍵など。
// server-only により Client Component から import するとビルドが失敗し、
// クライアントバンドルへの秘密混入を機械的に防ぐ。

// 必須の環境変数を読む。未設定なら起動時点で落とす（設定漏れを本番まで持ち越さない）。
function required(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const serverEnv = {
  supabaseDatabaseUrl: required('SUPABASE_DATABASE_URL'),
  // 使用する Postgres スキーマ（develop / public）
  supabaseDatabaseSchema: required('SUPABASE_DATABASE_SCHEMA'),
  // Cookie セッションの署名に使う秘密鍵（P1 認証で使用）
  sessionSecret: required('SESSION_SECRET')
};
