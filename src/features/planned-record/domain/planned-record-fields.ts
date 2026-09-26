import { resolveRecordType } from '@/lib/shared/domain/recordType';
import type { Id } from '@/lib/shared/types/id';
import type { RecordType } from '@/lib/shared/types/recordType';

// planned_record の永続化フィールド（user_id / pair_id / record_type）を
// isPair・isInstead から導出する。record_type は共有の resolveRecordType 経由で
// 算出し、数値を手書きしない。
// planned_records は is_settled を持たない（実体化時に SQL が導出する）。

type ResolvePlannedRecordOwnershipInput = {
  userUid: string;
  pairId: Id | null;
  isPair: boolean;
  isInstead: boolean;
};

type PlannedRecordOwnership = {
  userId: string | null;
  pairId: Id | null;
  recordType: RecordType;
};

// 定期（SELF/INSTEAD/PAIR）の所有者・record_type を導出する。
// PAIR（共有・非立替）は user_id を持たず pair_id のみ。INSTEAD（立替）は
// 立替者を特定するため user_id と pair_id の両方を持つ。
export function resolvePlannedRecordOwnership({
  userUid,
  pairId,
  isPair,
  isInstead
}: ResolvePlannedRecordOwnershipInput): PlannedRecordOwnership {
  return {
    userId: isPair && !isInstead ? null : userUid,
    pairId: isPair ? pairId : null,
    recordType: resolveRecordType({ isPair, isInstead })
  };
}
