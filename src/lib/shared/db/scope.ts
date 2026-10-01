import { eq, or, type SQL } from 'drizzle-orm';
import type { PgColumn } from 'drizzle-orm/pg-core';
import type { SessionScope } from '@/lib/shared/types/auth';

// DB 直結のクライアントは RLS をバイパスするため、ペア家計簿の「自分と共有相手の
// データだけ見える」制御をアプリ層で保証する。取得系リポジトリは db を直接
// where せず必ず buildScopeWhere / buildOwnerScopeWhere を経由すること。
// scope 漏れは他ペアのデータ露出（情報漏洩）に直結する。

// 多くのテーブル（methods / types / plan_types / records / planned_records /
// plans / memos / reminders）は user_id と pair_id の "どちらか一方"
// を持つ。pairId はログイン時に確定済みなので `user_id = 自分 OR pair_id = pairId`
// で「自分 or ペア」を表現できる。
//
// 条件式はカラム参照を要するため、対象テーブルの user_id / pair_id 列を
// 呼び出し側から渡す。
type UserPairColumns = {
  userId: PgColumn;
  pairId: PgColumn;
};

// user_id / pair_id のどちらか一方を持つテーブル用の where 断片を作る。
// pairId が無い（ペア未設定）ユーザは自分の user_id 一致のみに絞る。
export function buildScopeWhere(
  { userId, pairId }: UserPairColumns,
  scope: SessionScope
): SQL {
  const self = eq(userId, scope.userUid);
  if (scope.pairId === null) {
    return self;
  }
  // or() は引数が全て定義済みなら必ず SQL を返す。
  return or(self, eq(pairId, scope.pairId)) as SQL;
}

// どちらのヘルパを使うかの対応（誤選択は scope 漏れ＝情報漏洩に直結）:
// - records は pair_id を持ち「自分 or ペア」で見えるべき → buildScopeWhere（pair 込み）
// - banks / bank_balances は個人専用（pair で共有しない） → buildOwnerScopeWhere

// 個人専用テーブル（banks / bank_balances 経由取得）用。
// pair は考慮せず自分の user_id 一致のみ。
export function buildOwnerScopeWhere(
  userId: PgColumn,
  scope: Pick<SessionScope, 'userUid'>
): SQL {
  return eq(userId, scope.userUid);
}
