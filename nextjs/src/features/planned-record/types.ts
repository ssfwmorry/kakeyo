import type { Id } from '@/lib/shared/types/id';

// planned-record feature の公開 FE 型（server-only を含まない。
// Client Component / barrel / Vitest から利用可）。
// 旧 RPC get_planned_record_list の出力を camelCase 化した形を単一の正とする。

// get_planned_record_list の 1 行（設定「定期」タブの一覧表示用）。
export type PlannedRecordListItem = {
  id: Id;
  // 自分の planned_record なら true（旧 is_self）。
  isSelf: boolean;
  isPay: boolean;
  price: number;
  memo: string | null;
  sort: number;
  isPair: boolean;
  // 立替した人の名前（共有かつ user_id あり）。立替でなければ null。
  pairUserName: string | null;
  dayClassificationId: Id;
  dayClassificationName: string;
  methodId: Id;
  methodName: string;
  methodColorClassificationName: string;
  typeId: Id;
  typeName: string;
  typeColorClassificationName: string;
  subTypeId: Id | null;
  subTypeName: string | null;
};

// 自分/ペアに振り分けた定期一覧（旧 getPlannedRecordList の self/pair を踏襲）。
export type GroupedPlannedRecordList = {
  self: PlannedRecordListItem[];
  pair: PlannedRecordListItem[];
};

// note（定期編集）が受け取る初期値（planned_record 1 件分）。新規時は undefined。
// isPair は編集対象の共有状態（旧 note は編集中の isPair 切替を禁止していたため、
// 編集時は Cookie のペアモードではなくこの値で UI を固定する）。
export type NotePlannedRecordDefault = {
  id: Id;
  isPay: boolean;
  dayClassificationId: Id;
  methodId: Id;
  typeId: Id;
  subTypeId: Id | null;
  memo: string | null;
  price: number;
  isInstead: boolean;
  isPair: boolean;
};

// サービス層の失敗分類（機械可読・UI 文言なし）。
export type PlannedRecordError =
  | 'pairRequired'
  | 'notInScope'
  | 'foreignKey'
  | 'unknown';
