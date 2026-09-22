import type { Id } from '@/lib/shared/types/id';

// L5 plan / reminder 画面の FE 型（server-only を含まない。
// Client Component / barrel / Vitest から利用可）。
// 被参照 I/F（repositories 側の *Row）とは別に、色名・is_pair・self/pair
// グルーピングを含む画面専用の形をここに置く。

// 予定カテゴリカード 1 件（色名・並び込み）。
export type PlanTypeCard = {
  id: Id;
  name: string;
  colorClassificationId: Id;
  colorName: string;
  isPair: boolean;
};

// 自分/ペアに振り分けた予定カテゴリ一覧。plan 画面のセレクトと設定タブで共有。
export type GroupedPlanTypeList = {
  self: PlanTypeCard[];
  pair: PlanTypeCard[];
};

// カレンダー等で表示する plan 1 件（色名込み・日付は YYYY-MM-DD 文字列）。
export type PlanItem = {
  id: Id;
  startDate: string;
  endDate: string;
  name: string;
  memo: string | null;
  planTypeId: Id | null;
  planTypeName: string | null;
  planTypeColorName: string | null;
  reminderColorName: string | null;
  reminderId: Id | null;
  isPair: boolean;
};

// reminder + condition + 色名を束ねた表示用 1 件。
export type ReminderItem = {
  id: Id;
  name: string;
  reminderType: number;
  date: string;
  memo: string | null;
  colorClassificationId: Id;
  colorName: string;
  isPair: boolean;
  conditionId: Id;
  conditionType: number;
  month: number | null;
  monthDay: string | null;
  baseType: number | null;
};

// 自分/ペア/全件に振り分けた reminder 一覧（現行 getReminderList の self/pair/all を踏襲）。
export type GroupedReminderList = {
  self: ReminderItem[];
  pair: ReminderItem[];
  all: ReminderItem[];
};

// サービス層の失敗分類（機械可読・UI 文言なし）。
// 到達可能な分類のみ載せる（pairRequired = ペア未設定でペア作成しようとした等）。
export type PlanReminderError =
  | 'pairRequired'
  | 'notInScope'
  | 'foreignKey'
  | 'unknown';
