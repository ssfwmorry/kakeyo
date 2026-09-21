import type { SessionScope } from '@/lib/types/auth';

// 本移行の心臓（凍結資産）。
// Prisma は DB 直結で RLS をバイパスするため、ペア家計簿の「自分と共有相手の
// データだけ見える」制御をアプリ層で保証する。取得系リポジトリは prisma を直接
// where せず必ず buildScopeWhere / buildOwnerScopeWhere を経由すること。
// scope 漏れは他ペアのデータ露出（情報漏洩）に直結する。

// 多くのテーブル（methods / types / plan_types / records / planned_records /
// plans / memos / short_cuts / reminders）は user_id と pair_id の "どちらか一方"
// を持つ。旧 RPC の `user_id = 自分 OR pairs.user1_id/user2_id = 自分` は、pairId が
// ログイン時に確定済みの本移行では `user_id = 自分 OR pair_id = pairId` に等価。
type UserPairScopedWhere = {
  OR: Array<{ userId: string } | { pairId: number }>;
};

// user_id / pair_id のどちらか一方を持つテーブル用の where 断片を作る。
// pairId が無い（ペア未設定）ユーザは自分の user_id 一致のみに絞る。
export function buildScopeWhere({
  userUid,
  pairId
}: SessionScope): UserPairScopedWhere {
  const or: UserPairScopedWhere['OR'] = [{ userId: userUid }];
  if (pairId !== null) {
    or.push({ pairId });
  }
  return { OR: or };
}

// どちらのヘルパを使うかの対応（誤選択は scope 漏れ＝情報漏洩に直結。手順書 §9）:
// - records は pair_id を持ち「自分 or ペア」で見えるべき → buildScopeWhere（pair 込み）
// - banks / bank_balances / short_cuts は個人専用（pair で共有しない） → buildOwnerScopeWhere
type OwnerScopedWhere = {
  userId: string;
};

// 個人専用テーブル（banks / bank_balances 経由 / short_cuts 取得）用。
// pair は考慮せず自分の user_id 一致のみ。
export function buildOwnerScopeWhere({
  userUid
}: Pick<SessionScope, 'userUid'>): OwnerScopedWhere {
  return { userId: userUid };
}
