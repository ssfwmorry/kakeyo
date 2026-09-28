import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

// Prisma 7 では接続 URL を schema.prisma ではなくここに置く。
// develop / public のスキーマ切替は接続文字列の ?schema= もしくは
// PrismaClient 側 adapter の schema オプションで行う（lib/db/client.ts）。
type Env = {
  SUPABASE_DATABASE_URL: string;
};

export default defineConfig({
  schema: './prisma/schema.prisma',
  datasource: {
    url: env<Env>('SUPABASE_DATABASE_URL')
  }
});
