import 'server-only';
import { PrismaPg } from '@prisma/adapter-pg';
import { serverEnv } from '@/lib/server/env.server';
import { PrismaClient } from '@/prisma/generated/client';

// Prisma クライアントのシングルトン（凍結資産）。
// - adapter-pg で DB 直結（RLS はバイパス。絞り込みは lib/db/scope.ts に集約 = P1）。
// - スキーマ（develop / public）は接続時に指定する。
// - dev の HMR で複数インスタンスが生成されるのを防ぐため globalThis にキャッシュする。
//
// 【重要】このクライアントは RLS をバイパスするため、全取得系は必ず P1 の
// buildScopeWhere（lib/db/scope.ts）を通して自分/ペアに絞り込むこと。
// 生の prisma を scope なしで直接呼ぶと他ペアのデータが漏れる（手順書 §8 レビュー観点②）。

const adapter = new PrismaPg(
  { connectionString: serverEnv.supabaseDatabaseUrl },
  { schema: serverEnv.supabaseDatabaseSchema }
);

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
