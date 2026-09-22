import type { RecordListItem } from '@/features/record';

// record の「自分視点の支払方向（isPay 相当）」を返す純粋関数（calendar ドメイン共有）。
// 集計（day-sum の符号）と表示（day-record-list の符号）で判定がズレると家計の数字と
// 見た目が食い違うため、この 1 箇所に集約して両者から使う。
//
// 精算(isSettlement)は is_pay=null のため、自分が送金側か(isSelf)で支払方向を決める。
// 精算でなくても isPay が null のケース（送金 method 等）は同様に isSelf を採る。
// それ以外は record 本来の isPay に従う。
export function resolveDisplayIsPay(record: RecordListItem): boolean {
  if (record.isSettlement === true || record.isPay === null) {
    return record.isSelf;
  }
  return record.isPay;
}
