import 'server-only';
import { prisma } from '@/lib/server/db/client';
import type { Id } from '@/lib/shared/types/id';

// ペア ID の取得。getSessionData がセッションごとに呼ぶ。
// uid が user1_id / user2_id のいずれかである pair.id を返す。0 件 = null（ペア未設定）。
// pairs 自体が uid 一致で絞られるため buildScopeWhere は経由しない
// （scope の対象は user_id / pair_id を持つドメインテーブル）。
//
// 1 ユーザに紐づく pair は高々 1 件のはず。2 件以上ヒットしたら DB の状態が壊れており
// （どちらのペアの共有データを見せるか一意に決められない）、黙って先頭を採用すると
// 誤ったペアのデータを混ぜて表示しかねないため、静かに握りつぶさず throw する。
export async function getPairId(userUid: string): Promise<Id | null> {
  const pairs = await prisma.pair.findMany({
    where: {
      OR: [{ user1Id: userUid }, { user2Id: userUid }]
    },
    select: { id: true },
    take: 2
  });
  if (pairs.length > 1) {
    throw new Error(
      `pair の状態が不正です（uid=${userUid} に複数の pair が紐づいています）`
    );
  }
  return pairs[0]?.id ?? null;
}
