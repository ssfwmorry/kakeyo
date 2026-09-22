import type { Id } from '@/lib/shared/types/id';
import type { RecordType } from '@/lib/shared/types/recordType';

// record feature の公開 FE 型。records.id は BigInt だが、ここに現れる id は全て
// リポジトリ層で Number 済みの number（Id）で、Server→Client を跨いでも落ちない。
// L6 summary/records は getRecordList / getSummarizedRecordList / getPairedRecordList の
// 戻り型を @/features/record barrel から参照する。

// get_record_list の 1 行（カレンダー表示用）。旧 RPC の出力を camelCase 化し、
// id は record_id を採用、type_name の '精算' 補完・isInstead/isSettlement 導出済み。
export type RecordListItem = {
  id: Id;
  // 自分の record なら true、共有相手の record なら false。
  isSelf: boolean;
  datetime: Date;
  isPay: boolean | null;
  price: number;
  memo: string | null;
  recordType: RecordType;
  plannedRecordId: Id | null;
  methodId: Id;
  methodName: string;
  methodColorClassificationName: string;
  typeId: Id | null;
  // record_type=15（精算）または type 未設定は '精算' 補完済み。
  typeName: string | null;
  subTypeId: Id | null;
  subTypeName: string | null;
  typeColorClassificationName: string | null;
  isPair: boolean;
  pairUserName: string | null;
  // 個人 record（!isPair）は null。共有 record では立替/精算かどうかを保持する。
  isInstead: boolean | null;
  isSettlement: boolean | null;
};

// get_summarized_record_list の 1 行（records 明細画面用・精算=15 は除外される）。
// get_record_list とほぼ同形だが isSettlement を持たない（旧 FE 整形に合わせる）。
export type SummarizedRecordItem = {
  id: Id;
  isSelf: boolean;
  datetime: Date;
  isPay: boolean | null;
  price: number;
  memo: string | null;
  recordType: RecordType;
  plannedRecordId: Id | null;
  methodId: Id;
  methodName: string;
  methodColorClassificationName: string;
  typeId: Id | null;
  typeName: string | null;
  subTypeId: Id | null;
  subTypeName: string | null;
  typeColorClassificationName: string | null;
  isPair: boolean;
  pairUserName: string | null;
  isInstead: boolean | null;
};

// get_paired_record_list の 1 行（精算画面用）。is_settled 以外は編集不可のため
// 旧 RPC は id/表示に必要な最小列のみ返す。type_name/色は '精算' 補完済み。
export type PairedRecordItem = {
  id: Id;
  datetime: Date;
  isSelf: boolean;
  isPay: boolean | null;
  price: number;
  memo: string | null;
  recordType: RecordType;
  isSettled: boolean | null;
  isPlannedRecord: boolean;
  methodName: string;
  methodColorClassificationName: string;
  typeName: string;
  subTypeName: string | null;
  typeColorClassificationName: string;
  isInstead: boolean;
  isSettlement: boolean;
};

// note（記録編集）用: 初期値 1 件（record 1 件分のプリフィル）。新規時は undefined。
// scope 外・不存在は null（呼び出し側で新規扱いにする）。旧 note.vue setPageRecord の
// 編集プリフィル項目（id/isPay/date/price/memo/methodId/isInstead/typeId/subTypeId）に対応。
export type NoteRecordDefault = {
  id: Id;
  isPay: boolean;
  // YYYY-MM-DD（JST 暦日）。datetime を toDateStringJst で丸めたもの。
  date: string;
  methodId: Id;
  typeId: Id | null;
  subTypeId: Id | null;
  memo: string | null;
  price: number;
  isInstead: boolean;
};

// 検索条件（get_summarized_record_list の input）。records 明細画面が組み立てる。
export type SummarizedRecordQuery = {
  isPay: boolean;
  // true = type/sub_type で絞る、false = method で絞る。
  isType: boolean;
  isPair: boolean;
  isIncludeInstead: boolean;
  // 'YYYY-MM'。
  yearMonth: string;
  // isType のとき type_id、そうでなければ method_id。
  id: Id;
  // isType のときのみ有効なサブカテゴリ絞り込み（任意）。
  subTypeId: Id | null;
};

// サービス層の失敗分類（機械可読・UI 文言なし）。
export type RecordError =
  | 'pairRequired'
  | 'notInScope'
  | 'foreignKey'
  | 'sameMonthOnly'
  | 'noTarget'
  | 'unknown';
