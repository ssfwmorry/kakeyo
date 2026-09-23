import 'server-only';
import { defineTable, indexById } from './table';

// day_classifications（毎月何日か・全ユーザ共通の静的マスタ）。実マスタと同じ id・値を持つ。

export type DemoDayClassification = { id: number; name: string; value: number };

export const [days, dayRows] = defineTable({
  day1: { name: '毎月 1 日', value: 1 },
  day10: { name: '毎月 10 日', value: 10 },
  day15: { name: '毎月 15 日', value: 15 },
  day25: { name: '毎月 25 日', value: 25 }
});

export const findDay = indexById('day_classifications', dayRows);
