import 'server-only';
import { connection } from 'next/server';
import { todayJst, toYearMonthJst } from '@/lib/shared/domain/date';
import type { SessionData } from '@/lib/shared/types/auth';
import { CURRENT_YEAR_MONTH } from './dataset/records';

export const DEMO_REFERENCE_DATE = '2026-09-25';

// 基準日（画面が「今日」として扱う日）はリクエストごとに決まる値なので connection()
// の後で返す。セッションは private cache 経由で届き、それだけでは呼び出し元の
// Server Component がリクエスト時扱いにならないため、ここで明示しないと事前描画に
// 「今日」が紛れ込む。デモの定数分岐でも通すのは、デモは DB に触れず、後続の dayjs の
// tz 解析（内部で現在時刻を読む）まで事前描画が進んでしまうため。connection() は
// 実リクエストでは即時に解決する。
export async function getDemoReferenceDate(
  session?: Pick<SessionData, 'isDemo'> | null
): Promise<string> {
  await connection();
  return session?.isDemo ? DEMO_REFERENCE_DATE : todayJst();
}

export async function getDemoReferenceYearMonth(
  session?: Pick<SessionData, 'isDemo'> | null
): Promise<string> {
  await connection();
  return session?.isDemo ? CURRENT_YEAR_MONTH : toYearMonthJst(new Date());
}

// 入力モーダルの既定日。通常ユーザはクライアントが開いた瞬間に計算するので null。
export function getDemoTodayOverride(
  session?: Pick<SessionData, 'isDemo'> | null
): string | null {
  return session?.isDemo ? DEMO_REFERENCE_DATE : null;
}
