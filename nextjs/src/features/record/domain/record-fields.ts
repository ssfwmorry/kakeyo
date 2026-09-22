import { resolveRecordType } from '@/lib/shared/domain/recordType';
import type { Id } from '@/lib/shared/types/id';
import type { RecordType } from '@/lib/shared/types/recordType';

// record の永続化フィールドの導出（純粋関数・record ドメインの核）。
// 旧 Nuxt upsertRecord の分岐（user_id / pair_id / is_settled / record_type を
// isPair・isInstead から決める）をここ 1 箇所へ集約する。SQL/Prisma/React に
// 触れないため単体テスト可能。record_type は resolveRecordType 経由で算出し、
// 各所で 0/5/10/15 を手書きしない（方針確定書 §record_type）。
//
// 旧実装の対応（api/supabase/record.ts upsertRecord）:
//   user_id    = isPair && !isInstead ? null : userUid
//   pair_id    = isPair ? pairId : null
//   is_settled = isPair && isInstead ? false : null
//   record_type= !isPair ? 0 : isInstead ? 5 : 10

type ResolveRecordOwnershipInput = {
  userUid: string;
  pairId: Id | null;
  isPair: boolean;
  isInstead: boolean;
};

type RecordOwnership = {
  userId: string | null;
  pairId: Id | null;
  isSettled: boolean | null;
  recordType: RecordType;
};

// 通常記録（SELF/INSTEAD/PAIR）の所有者・精算フラグ・record_type を導出する。
// PAIR（共有・非立替）は user_id を持たず pair_id のみ。INSTEAD（立替）は
// 立替者を特定するため user_id と pair_id の両方を持ち is_settled=false で起票する。
export function resolveRecordOwnership({
  userUid,
  pairId,
  isPair,
  isInstead
}: ResolveRecordOwnershipInput): RecordOwnership {
  const recordType = resolveRecordType({ isPair, isInstead });
  return {
    // 共有かつ非立替（PAIR）のみ user_id を落とす。それ以外は起票者を残す。
    userId: isPair && !isInstead ? null : userUid,
    pairId: isPair ? pairId : null,
    // 立替（INSTEAD）のみ精算対象として false 起票。それ以外は精算概念なし=null。
    isSettled: isPair && isInstead ? false : null,
    recordType
  };
}

// record の「編集可否」を導出する純粋関数（一覧カードの編集導線ガード・機能安全）。
// 旧 pages/calendar.vue の isEnableEdit（172-175 行）を移植:
//   isEnableEdit = isSettlement !== true && (isSelf || (isPair && !isInstead))
// - 精算(isSettlement=true)は編集不可。
// - 自分の record は編集可。
// - 共有 record は「非立替（PAIR）」のみ編集可。ペア相手の立替 record は編集不可
//   （相手が起票した立替を自分が書き換えられないようにする）。
// isSettlement を持たない型（SummarizedRecordItem。精算は既に除外済み）では省略可。
export function resolveRecordEditable(record: {
  isSelf: boolean;
  isPair: boolean;
  isInstead: boolean | null;
  isSettlement?: boolean | null;
}): boolean {
  if (record.isSettlement === true) {
    return false;
  }
  return record.isSelf || (record.isPair && record.isInstead !== true);
}
