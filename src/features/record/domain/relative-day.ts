import { diffDaysJst } from '@/lib/shared/domain/date';

// 入力の日付に添える相対ラベル（デザイン Note の「今日」「昨日」「おととい」タグ）。
// 3 日より前は日付だけで足り、タグを出すと「4日前」まで数える羽目になるので出さない。

const RELATIVE_LABELS = ['今日', '昨日', 'おととい'] as const;

export function relativeDayLabel(date: string, today: string): string | null {
  const diff = diffDaysJst(today, date);
  if (diff < 0) {
    return null;
  }
  return RELATIVE_LABELS[diff] ?? null;
}
