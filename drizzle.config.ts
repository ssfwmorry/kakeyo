import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

// drizzle-kit の設定。マイグレーションは運用に入れず（DB のスキーマ変更は
// この repo の管理外）、実 DB からスキーマを引き直す introspect 用途のみに使う:
//   pnpm drizzle-kit pull
// 生成物は src/lib/server/db/schema.ts の手書き定義と突き合わせる参考にする
// （生成物をそのまま採用しない。schema.ts はスキーマ修飾を search_path に
// 委ねるため素の pgTable で書いている）。
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/lib/server/db/schema.ts',
  out: './.drizzle',
  schemaFilter: [process.env.SUPABASE_DATABASE_SCHEMA ?? 'develop'],
  dbCredentials: {
    url: process.env.SUPABASE_DATABASE_URL ?? ''
  }
});
