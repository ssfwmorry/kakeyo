import 'server-only';
import { todayJst, toYearMonthJst } from '@/lib/shared/domain/date';
import type { SessionData } from '@/lib/shared/types/auth';
import { CURRENT_YEAR_MONTH } from './dataset/records';

export const DEMO_REFERENCE_DATE = '2026-09-25';

export function getDemoReferenceDate(
  session?: Pick<SessionData, 'isDemo'> | null
): string {
  return session?.isDemo ? DEMO_REFERENCE_DATE : todayJst();
}

export function getDemoReferenceYearMonth(
  session?: Pick<SessionData, 'isDemo'> | null
): string {
  return session?.isDemo ? CURRENT_YEAR_MONTH : toYearMonthJst(new Date());
}
