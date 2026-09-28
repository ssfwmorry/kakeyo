import 'server-only';
import type { ColorClassification, DayClassification } from '@/features/master';
import { colorRows } from '../dataset/colors';
import { dayRows } from '../dataset/day-classifications';

// master のデモ射影。マスタは全ユーザ共通の静的データだが、デモは DB へ触れないため
// dataset の表を返す（実マスタと同じ id・名前）。

export function getColorClassificationList(): ColorClassification[] {
  return colorRows.map((row) => ({ id: row.id, name: row.name }));
}

export function getDayClassificationList(): DayClassification[] {
  return dayRows.map((row) => ({
    id: row.id,
    name: row.name,
    value: row.value
  }));
}
