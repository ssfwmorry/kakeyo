// クライアントへ露出してよい環境変数（NEXT_PUBLIC_*）。
// サーバ専用の秘密は lib/env.server.ts に分離し、こちらには置かない。

// NEXT_PUBLIC_* はビルド時に静的置換されるため、参照はリテラルで書く。
function requiredPublic(key: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const publicEnv = {
  supabaseUrl: requiredPublic(
    'NEXT_PUBLIC_SUPABASE_URL',
    process.env.NEXT_PUBLIC_SUPABASE_URL
  ),
  supabaseAnonKey: requiredPublic(
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
};
