import 'server-only';
import { prisma } from '@/lib/server/db/client';
import type { Id } from '@/lib/shared/types/id';

// L1 マスタ（color_classification）リポジトリ。
// 色ピッカーやカードの色分けに使う。L4/L5/L7/L8 が参照する被参照 I/F。
// マスタは全ユーザ共通の静的データのため scope 絞り込みは不要。

// color_classifications: 色マスタ（red / pink / ... / black）。
export type ColorClassification = {
  id: Id;
  name: string;
};

// READ
// 全ユーザ共通マスタ。id 昇順で安定させる（色選択 UI の並びを固定）。
export async function getColorClassificationList(): Promise<
  ColorClassification[]
> {
  return prisma.colorClassification.findMany({
    select: { id: true, name: true },
    orderBy: { id: 'asc' }
  });
}
