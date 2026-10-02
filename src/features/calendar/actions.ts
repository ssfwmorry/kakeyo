'use server';

import { requireAuth } from '@/features/auth/server/requireAuth';
import { getDemoReferenceYearMonth } from '@/features/demo/server/date';
import { materializePlannedRecordsForMonth } from '@/features/planned-record/server/services';
import { getCalendarMonth } from './server/services';
import type { CalendarMonthData } from './types';

// 月移動時のデータ再取得（Client の月ナビから呼ぶ）。
// yearMonth（YYYY-MM）が不正なら当月にフォールバックする（クライアント値を素通ししない）。
export async function getCalendarMonthAction(
  yearMonth: string
): Promise<CalendarMonthData> {
  const session = await requireAuth();
  const normalized = /^\d{4}-\d{2}$/.test(yearMonth)
    ? yearMonth
    : await getDemoReferenceYearMonth(session);
  await materializePlannedRecordsForMonth(session, normalized);
  return getCalendarMonth(session, normalized);
}
