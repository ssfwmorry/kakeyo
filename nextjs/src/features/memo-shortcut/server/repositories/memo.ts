import 'server-only';
import { prisma } from '@/lib/server/db/client';
import { buildScopeWhere } from '@/lib/shared/db/scope';
import type { SessionData, SessionScope } from '@/lib/shared/types/auth';
import type { Id } from '@/lib/shared/types/id';

// memo は pair 共有テーブル（自分 or ペアの TODO が見える）ため buildScopeWhere を通す。
// memo の PK は int（BigInt ではない）ので id 変換は不要。

export type MemoListItem = {
  id: Id;
  memo: string;
  // 個人 TODO なら true、ペア共有 TODO なら false。
  isPair: boolean;
};

export type MemoDeleteError = 'notFound';

export async function getMemoList(
  scope: SessionScope
): Promise<MemoListItem[]> {
  const rows = await prisma.memo.findMany({
    where: buildScopeWhere(scope),
    orderBy: { id: 'asc' }
  });
  return rows.map((row) => ({
    id: row.id,
    memo: row.memo,
    isPair: row.pairId !== null
  }));
}

// isPair のとき pair_id、そうでなければ user_id に紐づける。
// isPair だが pairId 未設定（ペア未登録）は本来サービス層で弾く前提だが、
// 念のため pairId が無ければ個人 TODO として登録する。
export async function insertMemo(
  session: SessionData,
  input: { memo: string; isPair: boolean }
): Promise<void> {
  const usePair = input.isPair && session.pairId !== null;
  await prisma.memo.create({
    data: {
      memo: input.memo,
      userId: usePair ? null : session.userUid,
      pairId: usePair ? session.pairId : null
    }
  });
}

// deleteMany + scope を AND（IDOR 防止）。count===0 = 他人 or 不存在 = notFound。
export async function deleteMemo(
  scope: SessionScope,
  id: Id
): Promise<{ ok: true } | { ok: false; error: MemoDeleteError }> {
  const result = await prisma.memo.deleteMany({
    where: { AND: [{ id }, buildScopeWhere(scope)] }
  });
  if (result.count === 0) {
    return { ok: false, error: 'notFound' };
  }
  return { ok: true };
}
