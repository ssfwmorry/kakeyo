'use server';

import { requireAuth } from '@/features/auth/server/requireAuth';
import { todayJst } from '@/lib/shared/domain/date';
import { getCalendarMonth } from './server/services';
import type { CalendarMonthData } from './types';

// 月移動時のデータ再取得（Client の月ナビから呼ぶ）。表示は純粋読み取りのため
// 副作用はなく、Result ではなく CalendarMonthData を直返しする。
// yearMonth（YYYY-MM）が不正なら当月にフォールバックする（クライアント値を素通ししない）。
export async function getCalendarMonthAction(
  yearMonth: string
): Promise<CalendarMonthData> {
  const session = await requireAuth();
  const normalized = /^\d{4}-\d{2}$/.test(yearMonth)
    ? yearMonth
    : todayJst().slice(0, 7);
  return getCalendarMonth(session, normalized);
}
