import 'server-only';
import type { SessionData } from '@/lib/shared/types/auth';
import type { Id } from '@/lib/shared/types/id';
import { err, ok, type Result } from '@/lib/shared/types/result';

// 書き込み時の所有者（user_id / pair_id のどちらをセットするか）を解決する共通ヘルパ。
// read の scope 絞り込み（buildScopeWhere）と対になる「書き込み側の単一の正」。
// isPair=true なのに session.pairId が無ければ 'pairRequired'（ペア未設定）で失敗する。
//
// 戻り値のエラーは 'pairRequired' 固定。各 feature の error union はこれを含むため、
// Result<Owner, FeatureError> へそのまま代入互換（部分型）になる。

export type Owner = { userId: string | null; pairId: Id | null };

export function resolveOwner(
  session: SessionData,
  isPair: boolean
): Result<Owner, 'pairRequired'> {
  if (isPair) {
    if (session.pairId === null) {
      return err('pairRequired');
    }
    return ok({ userId: null, pairId: session.pairId });
  }
  return ok({ userId: session.userUid, pairId: null });
}
