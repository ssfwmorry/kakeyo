import 'server-only';
import { prisma } from '@/lib/server/db/client';
import { buildScopeWhere } from '@/lib/shared/db/scope';
import type { SessionData, SessionScope } from '@/lib/shared/types/auth';
import type { Id } from '@/lib/shared/types/id';

// L8 memo（TODO）レーンのリポジトリ（server-only）。
// ★ memo は pair 共有テーブル（自分 or ペアの TODO が見える）。取得は必ず
//   buildScopeWhere（pair 込み）を通す。scope 漏れ = 他ペア露出（最重要）。
// ★ 更新/削除は Prisma が RLS をバイパスするため、deleteMany の where に scope を
//   AND して IDOR（他人の id を指定して削除）を塞ぐ。memo の PK は int（BigInt でない）。

// 取得系の戻り（TODO 1 件）。
export type MemoListItem = {
  id: Id;
  memo: string;
  // 自分個人の TODO か（true）、ペア共有の TODO か（false）。UI での区別に使える。
  isPair: boolean;
};

// delete の失敗種別（機械可読）。UI 文言はサービス/アクション層で付与する。
export type MemoDeleteError = 'notFound';

// READ
// pair 込み scope で「自分 + ペア」の TODO を取得。id 昇順で安定させる。
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
    // pairId が入っている行はペア共有 TODO。
    isPair: row.pairId !== null
  }));
}

// CREATE
// isPair のとき pair_id、そうでなければ user_id に紐づける（旧 insertMemo の isPair 切替）。
// 所有列はサーバの session から確定し、クライアント値を信用しない。
// isPair だが pairId 未設定（ペア未登録）は呼び出し側でありえない前提だが、
// 念のため pairId が無ければ個人 TODO として登録する（サービス層で弾く設計）。
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

// DELETE
// ★ deleteMany + scope を AND。count===0 = 他人 or 不存在 = notFound。
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
