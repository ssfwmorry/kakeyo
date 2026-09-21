import 'server-only';
import { prisma } from '@/lib/db/client';
import type { Id } from '@/lib/types/id';

// ペア ID の取得（凍結資産）。getSessionData がセッションごとに呼ぶ。
// uid が user1_id / user2_id のいずれかである pair.id を返す。0 件 = null（ペア未設定）。
// pairs 自体が uid 一致で絞られるため buildScopeWhere は経由しない
// （scope の対象は user_id / pair_id を持つドメインテーブル）。

export async function getPairId(userUid: string): Promise<Id | null> {
  const pair = await prisma.pair.findFirst({
    where: {
      OR: [{ user1Id: userUid }, { user2Id: userUid }]
    },
    select: { id: true }
  });
  return pair?.id ?? null;
}
