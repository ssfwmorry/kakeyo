import { RecordType } from '@/lib/shared/types/recordType';

// record_type のドメイン計算（凍結資産・ドメイン計算の単一の正）。
// 記録登録時の record_type 算出をここ 1 箇所に集約する。各レーンは自前で
// 0/5/10/15 を書かずこれを使う。
// SETTLEMENT(15) は精算専用フローで直接指定されるため、通常記録の算出対象外。

type ResolveRecordTypeInput = {
  isPair: boolean;
  isInstead: boolean;
};

// 通常記録（SELF / INSTEAD / PAIR）の record_type を算出する。
export function resolveRecordType({
  isPair,
  isInstead
}: ResolveRecordTypeInput): RecordType {
  if (!isPair) {
    return RecordType.self;
  }
  if (isInstead) {
    return RecordType.instead;
  }
  return RecordType.pair;
}

// 精算対象（＝立替）かどうか。INSTEAD のみが精算の対象になる。
export function isSettlementTarget(recordType: RecordType): boolean {
  return recordType === RecordType.instead;
}
