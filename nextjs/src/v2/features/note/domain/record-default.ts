import type { NoteRecordDefault, RecordListItem } from '@/features/record';
import { toDateStringJst } from '@/lib/shared/domain/date';

// カレンダーの日別リストにある記録を、そのまま編集シートの初期値にする。
// 一覧の 1 行に編集に要る値が全部載っているので、開くたびにサーバーへ取りに行かない。
//
// 精算（isPay が null・カテゴリ無し）は入力フローで扱う形ではないので null を返し、
// 呼び出し側は行を押せなくする。

export function toRecordDefault(
  record: RecordListItem
): NoteRecordDefault | null {
  if (record.isPay === null || record.typeId === null) {
    return null;
  }
  return {
    id: record.id,
    isPay: record.isPay,
    date: toDateStringJst(record.datetime),
    methodId: record.methodId,
    typeId: record.typeId,
    subTypeId: record.subTypeId,
    memo: record.memo,
    price: record.price,
    isInstead: record.isInstead ?? false,
    isPair: record.isPair
  };
}
