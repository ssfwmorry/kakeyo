import 'server-only';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { serverEnv } from '@/lib/server/env.server';
import * as schema from './schema';

// Drizzle クライアントのシングルトン。
// - DB 直結（RLS はバイパス。絞り込みは lib/shared/db/scope.ts に集約）。
// - スキーマ（develop / public）は接続時の search_path で指定する。
// - dev の HMR で複数インスタンスが生成されるのを防ぐため globalThis にキャッシュする。
//
// 【重要】このクライアントは RLS をバイパスするため、全取得系は必ず
// buildScopeWhere / buildOwnerScopeWhere（lib/shared/db/scope.ts）を通して
// 自分/ペアに絞り込むこと。scope なしで直接呼ぶと他ペアのデータが漏れる。

// search_path は接続オプションに文字列として埋め込むためバインド変数にできない。
// 値は環境変数由来なので、ホワイトリスト（英数字と _ のみ、先頭は英字か _）で
// 厳格に検証してから使う。
const SCHEMA_NAME_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;

function validatedSchemaName(): string {
  const name = serverEnv.supabaseDatabaseSchema;
  if (!SCHEMA_NAME_PATTERN.test(name)) {
    throw new Error(
      `Invalid SUPABASE_DATABASE_SCHEMA: ${JSON.stringify(name)}`
    );
  }
  return name;
}

const globalForDb = globalThis as unknown as {
  dbPool?: Pool;
};

const pool =
  globalForDb.dbPool ??
  new Pool({
    connectionString: serverEnv.supabaseDatabaseUrl,
    options: `-c search_path=${validatedSchemaName()}`
  });

if (process.env.NODE_ENV !== 'production') {
  globalForDb.dbPool = pool;
}

export const db = drizzle(pool, { schema });
