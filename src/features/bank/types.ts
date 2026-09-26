import type { Id } from '@/lib/shared/types/id';
import type { TableRow } from './domain/balance-table';

// bank 画面の FE 型（server-only を含まない。Client Component / barrel から利用可）。

// 口座カード / チャート系列 1 件（色名込み）。
export type BankItem = {
  id: Id;
  name: string;
  colorClassificationId: Id;
  colorName: string;
  // 残高の記録が 1 件でもあるか。あれば削除できない（FK）ので、設定›口座が事前に案内する。
  hasBalance: boolean;
};

// 残高チャートの 1 点（積み上げ Area 用）。x=記録日(YYYY-MM-DD)、系列は bankId をキーに持つ。
export type BalanceChartPoint = {
  date: string;
  // bankId(文字列) → その日の残高（補完後）。未登録は 0（積み上げに寄与しない）。
  [bankId: string]: number | string;
};

// bank 画面が必要とする全データ（Server Component が組んで Client に渡す）。
export type BankScreenData = {
  banks: BankItem[];
  tableRows: TableRow[];
  chartPoints: BalanceChartPoint[];
};

// サービス層の失敗分類（機械可読・UI 文言なし）。
// リポジトリ/サービスが実際に返し得る 3 種のみ（到達不能な分類を型に載せない）。
export type BankError = 'notFound' | 'foreignKey' | 'notOwned';

export type { TableRow } from './domain/balance-table';
