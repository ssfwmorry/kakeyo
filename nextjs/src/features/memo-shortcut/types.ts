import type { Id } from '@/lib/shared/types/id';
import type { RecordType } from '@/lib/shared/types/recordType';

// memo/shortcut 画面の FE 型（server-only を含まない。Client Component /
// barrel / calendar 統合レーンから利用可能）。

// TODO（memo）1 件。
export type MemoItem = {
  id: Id;
  memo: string;
  // 個人 TODO（false）か、ペア共有 TODO（true）か。
  isPair: boolean;
};

// ショートカット 1 件（type/sub_type/method・color 名を結合済み）。
export type ShortCutItem = {
  id: Id;
  isPay: boolean;
  price: number;
  memo: string | null;
  recordType: RecordType;
  methodId: Id;
  methodName: string;
  typeId: Id;
  typeName: string;
  colorName: string;
  subTypeId: Id | null;
  subTypeName: string | null;
};

// サービス層の失敗分類（機械可読・UI 文言なし）。
// リポジトリ/サービスが実際に返し得る種別のみ（到達不能な分類を型に載せない）。
export type MemoError = 'notFound' | 'pairRequired';
