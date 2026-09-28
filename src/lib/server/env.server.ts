import 'server-only';

// サーバ専用の環境変数。DB URL / セッション秘密鍵など。
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

// 任意の環境変数を読む（未設定なら undefined）。
function optional(key: string): string | undefined {
  return process.env[key] || undefined;
}

export const serverEnv = {
  supabaseDatabaseUrl: required('SUPABASE_DATABASE_URL'),
  // 使用する Postgres スキーマ（develop / public）
  supabaseDatabaseSchema: required('SUPABASE_DATABASE_SCHEMA'),
  // 署名付きデモ Cookie の HMAC 鍵
  sessionSecret: required('SESSION_SECRET'),
  // 定期実体化 Cron の呼び出し認証に使う秘密。Vercel Cron は
  // Authorization: Bearer <CRON_SECRET> を付与する。未設定なら Cron を無効化する
  // （認証なしで実体化 INSERT を叩かせない）。
  cronSecret: optional('CRON_SECRET')
};
