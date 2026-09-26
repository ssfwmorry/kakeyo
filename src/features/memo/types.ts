import type { Id } from '@/lib/shared/types/id';

// memo（TODO）の FE 型（server-only を含まない。Client Component / barrel / calendar から利用可能）。

// TODO（memo）1 件。
export type MemoItem = {
  id: Id;
  memo: string;
  // 個人 TODO（false）か、ペア共有 TODO（true）か。
  isPair: boolean;
};

// サービス層の失敗分類（機械可読・UI 文言なし）。
// リポジトリ/サービスが実際に返し得る種別のみ（到達不能な分類を型に載せない）。
export type MemoError = 'notFound' | 'pairRequired';
