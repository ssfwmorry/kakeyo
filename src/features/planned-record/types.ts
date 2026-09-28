import type { Id } from '@/lib/shared/types/id';

// planned-record feature の公開 FE 型（server-only を含まない。
// Client Component / barrel / Vitest から利用可）。

// 設定「定期」タブの一覧表示用の 1 行。
export type PlannedRecordListItem = {
  id: Id;
  // 自分の planned_record なら true。
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

// 自分/ペアに振り分けた定期一覧。
export type GroupedPlannedRecordList = {
  self: PlannedRecordListItem[];
  pair: PlannedRecordListItem[];
};

// 定期編集が受け取る初期値（planned_record 1 件分）。新規時は undefined。
// isPair は編集対象の共有状態。編集中は isPair 切替を禁止するため、
// Cookie のペアモードではなくこの値で UI を固定する。
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
