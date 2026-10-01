import 'server-only';
import { asc } from 'drizzle-orm';
import { cacheLife, cacheTag } from 'next/cache';
import { db } from '@/lib/server/db/client';
import { dayClassifications } from '@/lib/server/db/schema';
import type { Id } from '@/lib/shared/types/id';

// マスタ（day_classification）リポジトリ。
// 定期+Cron が参照する被参照 I/F。
// マスタは全ユーザ共通の静的データのため scope 絞り込みは不要。

// day_classifications: 毎月何日か（1/10/15/25 日）。value が実際の「日」。
export type DayClassification = {
  id: Id;
  name: string;
  value: number;
};

// 全ユーザ共通マスタ。id 昇順で安定させる（選択 UI の並びを固定）。
// Cookie を読まず全ユーザ共通・不変なのでサーバキャッシュに載る（色マスタと同方針）。
export async function getDayClassificationList(): Promise<DayClassification[]> {
  'use cache';
  cacheLife('days');
  cacheTag('day-classification');

  return db
    .select({
      id: dayClassifications.id,
      name: dayClassifications.name,
      value: dayClassifications.value
    })
    .from(dayClassifications)
    .orderBy(asc(dayClassifications.id));
}
