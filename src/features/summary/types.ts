import type { Id } from '@/lib/shared/types/id';

// summary feature の公開 FE 型（server-only を含まない = Client / Vitest 用）。
// id は int（BigInt を含まない）。

// sub_type 行を subTypes に畳み込み済みのカテゴリ 1 件。
// typeId=null は精算 record（type 未設定）の集計行。
export type TypeSummaryItem = {
  typeId: Id | null;
  typeName: string | null;
  isPair: boolean;
  // types の色名。精算（typeId=null）は null。
  colorName: string | null;
  // カテゴリ合計（sub_type 未設定分を含む）。
  sum: number;
  subTypes: TypeSummarySubItem[];
};

export type TypeSummarySubItem = {
  subTypeId: Id;
  subTypeName: string;
  subTypeSum: number;
};

// get_method_summary の 1 行。
export type MethodSummaryItem = {
  methodId: Id;
  methodName: string;
  // 立替した人の名前（共有 method 以外は null）。
  pairUserName: string | null;
  colorName: string;
  isPair: boolean;
  sum: number;
};

// 登録がない月は返らない。
export type PayAndIncomeItem = {
  yearMonth: string;
  paySum: number;
  incomeSum: number;
};

// typeId=null は精算 record の集計行。
export type TypeSummaryPeriodRow = {
  yearMonth: string;
  typeId: Id | null;
  typeName: string | null;
  typeColorClassificationName: string | null;
  sum: number;
};

// 月 × サブカテゴリの合計。subTypeId=null は「サブカテゴリなし」の合計。
export type SubTypeSummaryRow = {
  yearMonth: string;
  subTypeId: Id | null;
  sum: number;
};

// 円グラフ（内訳）タブの集計クエリ。
export type PieSummaryQuery = {
  isPay: boolean;
  isPair: boolean;
  isIncludeInstead: boolean;
  yearMonth: string;
};

// 年次カテゴリ別集計（推移 > カテゴリ別）のクエリ。
export type TypeSummaryPeriodQuery = {
  isPay: boolean;
  isPair: boolean;
  year: number;
};

// 推移 > カテゴリ別のチップ（カテゴリ選択）。
// isPay × isPair の組で表示するカテゴリが変わるため、4 象限分を保持する。
export type TypeChip = {
  typeId: Id;
  name: string;
  colorName: string;
};

// isPay × isPair の 4 象限に振り分けたカテゴリチップ。
export type TypeChipsByQuadrant = {
  pay: { self: TypeChip[]; pair: TypeChip[] };
  income: { self: TypeChip[]; pair: TypeChip[] };
};

// summary 画面が Server Component で組んで Client に渡す初期データ一式。
// 各タブは Client 側で年月/トグルを変えて Server Action 経由で再取得する。
export type SummaryScreenData = {
  // 現在ペアモードか（session.pairId!==null かつ Cookie が true）。
  isPair: boolean;
  // ペアが存在するか（精算タブの表示可否）。
  isExistPair: boolean;
};
