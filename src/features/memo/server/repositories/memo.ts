import 'server-only';
import { and, asc, eq } from 'drizzle-orm';
import { db } from '@/lib/server/db/client';
import { memos } from '@/lib/server/db/schema';
import { buildScopeWhere } from '@/lib/shared/db/scope';
import type { SessionData, SessionScope } from '@/lib/shared/types/auth';
import type { Id } from '@/lib/shared/types/id';

// memo は pair 共有テーブル（自分 or ペアの TODO が見える）ため buildScopeWhere を通す。
// memo の PK は int（BigInt ではない）ので id 変換は不要。

export type MemoListItem = {
  id: Id;
  memo: string;
  // ペア共有 TODO なら true、個人 TODO なら false。
  isPair: boolean;
};

export type MemoDeleteError = 'notFound';

export async function getMemoList(
  scope: SessionScope
): Promise<MemoListItem[]> {
  const rows = await db
    .select()
    .from(memos)
    .where(buildScopeWhere(memos, scope))
    .orderBy(asc(memos.id));
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
  await db.insert(memos).values({
    memo: input.memo,
    userId: usePair ? null : session.userUid,
    pairId: usePair ? session.pairId : null
  });
}

// 削除条件に scope を AND（IDOR 防止）。0 件 = 他人 or 不存在 = notFound。
export async function deleteMemo(
  scope: SessionScope,
  id: Id
): Promise<{ ok: true } | { ok: false; error: MemoDeleteError }> {
  const deleted = await db
    .delete(memos)
    .where(and(eq(memos.id, id), buildScopeWhere(memos, scope)))
    .returning({ id: memos.id });
  if (deleted.length === 0) {
    return { ok: false, error: 'notFound' };
  }
  return { ok: true };
}
