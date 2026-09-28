import type { Id } from '@/lib/shared/types/id';

// 画面（設定）用の FE 型。被参照 I/F（repositories の *Summary）とは別に、
// 色名・is_pair・income/pay × self/pair グルーピングを含む画面専用の形をここに置く。
// server-only を含まないため Client Component / Vitest から import 可能。

// カテゴリ設定カード 1 件（色名・並び込み）。
export type TypeCard = {
  id: Id;
  name: string;
  colorClassificationId: Id;
  colorName: string;
  isPair: boolean;
  subTypes: SubTypeCard[];
};

export type SubTypeCard = {
  id: Id;
  name: string;
};

// 収入/支出 × 自分/ペア のグルーピング済みカテゴリ一覧。
export type GroupedTypeList = {
  income: { self: TypeCard[]; pair: TypeCard[] };
  pay: { self: TypeCard[]; pair: TypeCard[] };
};

// 方法設定カード 1 件（色名・並び込み）。
export type MethodCard = {
  id: Id;
  name: string;
  colorClassificationId: Id;
  colorName: string;
  isPair: boolean;
};

// 支払/受取/精算 × 自分/ペア のグルーピング済み方法一覧。
// both（精算）は pair 専用（self は常に空）。
export type GroupedMethodList = {
  income: { self: MethodCard[]; pair: MethodCard[] };
  pay: { self: MethodCard[]; pair: MethodCard[] };
  both: { self: MethodCard[]; pair: MethodCard[] };
};

// サービス層の失敗分類（機械可読・UI 文言なし）。
export type TypeMethodError =
  | 'pairRequired'
  | 'notInScope'
  | 'foreignKey'
  | 'unknown';
