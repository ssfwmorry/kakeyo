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

// 任意の環境変数を読む（未設定なら undefined）。デモ資格情報など必須でないもの向け。
function optional(key: string): string | undefined {
  return process.env[key] || undefined;
}

export const serverEnv = {
  supabaseDatabaseUrl: required('SUPABASE_DATABASE_URL'),
  // 使用する Postgres スキーマ（develop / public）
  supabaseDatabaseSchema: required('SUPABASE_DATABASE_SCHEMA'),
  // Cookie セッションの署名に使う秘密鍵
  sessionSecret: required('SESSION_SECRET'),
  // デモログイン用の資格情報。未設定ならデモ無効。
  demoUserEmail: optional('DEMO_USER_EMAIL'),
  demoUserPassword: optional('DEMO_USER_PASSWORD'),
  // 定期実体化 Cron の呼び出し認証に使う秘密。Vercel Cron は
  // Authorization: Bearer <CRON_SECRET> を付与する。未設定なら Cron を無効化する
  // （認証なしで実体化 INSERT を叩かせない）。
  cronSecret: optional('CRON_SECRET')
};
