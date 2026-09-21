import type { Id } from '@/lib/shared/types/id';

// 認証・スコープの共有型（凍結資産）。
// 全リポジトリの取得系は SessionScope を受け取り buildScopeWhere で自分/ペアに絞る。

export type SessionData = {
  userUid: string;
  // ペア未設定なら null。
  pairId: Id | null;
  email: string;
  isDemo: boolean;
};

// 取得系に渡す絞り込みスコープ。userUid と pairId で「自分 or 自分のペア」が一意に定まる。
export type SessionScope = Pick<SessionData, 'userUid' | 'pairId'>;
