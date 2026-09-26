import 'server-only';
import type { SessionScope } from '@/lib/shared/types/auth';
import type { Owned } from './users';

// 可視判定（buildScopeWhere / buildOwnerScopeWhere の dataset 版）。
// solo / pair の出し分けはここ 1 箇所の規則で行い、各 feature が solo 用・pair 用の
// リストを手で組まない。デモの session.pairId はログイン時の mode を反映する
// （pair なら DEMO_PAIR_ID、solo なら null）ため、実 DB と同じく scope で絞れば出し分けが決まる。

// user_id / pair_id のどちらか一方を持つテーブル用（buildScopeWhere 相当）。
// 実 DB は「user_id = 自分 OR pair_id = 自分の pair」だが、solo デモは「ペアを組んでいない世界」
// のため、自分が起票した行でも pair_id 付き（立替・精算）は存在しないものとして隠す。
export function isVisibleTo(scope: SessionScope, row: Owned): boolean {
  if (scope.pairId === null) {
    return row.userUid === scope.userUid && row.pairId === null;
  }
  return row.userUid === scope.userUid || row.pairId === scope.pairId;
}

export function visibleTo<R extends Owned>(
  scope: SessionScope,
  rows: R[]
): R[] {
  return rows.filter((row) => isVisibleTo(scope, row));
}

// 個人専用テーブル（banks）用（buildOwnerScopeWhere 相当）。
export function ownedBy<R extends Pick<Owned, 'userUid'>>(
  scope: Pick<SessionScope, 'userUid'>,
  rows: R[]
): R[] {
  return rows.filter((row) => row.userUid === scope.userUid);
}
