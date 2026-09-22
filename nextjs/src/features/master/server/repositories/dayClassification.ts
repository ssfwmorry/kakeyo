import 'server-only';
import { prisma } from '@/lib/server/db/client';
import type { Id } from '@/lib/shared/types/id';

// L1 マスタ（day_classification）リポジトリ。
// L3 定期+Cron が参照する被参照 I/F（型・シグネチャは凍結済みで変更不可）。
// マスタは全ユーザ共通の静的データのため scope 絞り込みは不要。

// day_classifications: 毎月何日か（1/10/15/25 日）。value が実際の「日」。
export type DayClassification = {
  id: Id;
  name: string;
  value: number;
};

// READ
// 全ユーザ共通マスタ。id 昇順で安定させる（選択 UI の並びを固定）。
export async function getDayClassificationList(): Promise<DayClassification[]> {
  return prisma.dayClassification.findMany({
    select: { id: true, name: true, value: true },
    orderBy: { id: 'asc' }
  });
}
