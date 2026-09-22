// reminder / condition のドメイン計算（純粋関数）。
// SSR 事故防止のため日付は @/lib/shared/domain/date.ts 経由でのみ扱う（dayjs 直 import 禁止）。

import { toDateStringJst } from '@/lib/shared/domain/date';

// condition_type: 5(MONTH)=〜ヶ月後 / 10(MONTH_DAY)=月日指定。
export const ConditionType = {
  month: 5,
  monthDay: 10
} as const;
export type ConditionType = (typeof ConditionType)[keyof typeof ConditionType];

// base_type: 5(NOW)=基準が現在日付 / 10(DATE)=基準が reminder.date。
export const BaseType = {
  now: 5,
  date: 10
} as const;
export type BaseType = (typeof BaseType)[keyof typeof BaseType];

// reminder_type: 5(Flow)=チェックで日付更新のみ / 10(Stock)=チェックで plan 化。
export const ReminderType = {
  flow: 5,
  stock: 10
} as const;
export type ReminderType = (typeof ReminderType)[keyof typeof ReminderType];

// 次回日付計算に渡す条件（DB 由来の condition 行を写したもの）。
export type NextDateInput = {
  conditionType: number;
  month: number | null;
  monthDay: string | null;
  baseType: number | null;
  // reminder.date（base_type=DATE / 現在日付でない基準で使う）。YYYY-MM-DD。
  currentDate: string;
  // 「今日」（純粋化のため呼び出し側で注入必須。テスト容易性も兼ねる）。
  today: string;
};

// 次回日付を計算する。
// - MONTH_DAY: 翌年の MM-DD を次回日付にする。
// - MONTH: 基準（NOW=today / DATE=currentDate）から month ヶ月後。
// 戻りは YYYY-MM-DD（JST 日付境界）。不正な条件は null（呼び出し側でエラー化）。
export function calcNextReminderDate(input: NextDateInput): string | null {
  if (input.conditionType === ConditionType.monthDay) {
    if (input.monthDay === null) {
      return null;
    }
    // 翌年の MM-DD。today の年 + 1 の MM-DD を JST 日付として丸める。
    const nextYear = Number(input.today.slice(0, 4)) + 1;
    return toDateStringJst(`${nextYear}-${input.monthDay}`);
  }

  if (input.conditionType === ConditionType.month) {
    if (input.month === null || input.baseType === null) {
      return null;
    }
    const base =
      input.baseType === BaseType.now ? input.today : input.currentDate;
    return addMonthsJst(base, input.month);
  }

  return null;
}

// YYYY-MM-DD に month ヶ月加算し YYYY-MM-DD（JST）で返す。
// dayjs 直 import を避けるため、date.ts の関数のみで月加算を実装する。
function addMonthsJst(dateString: string, months: number): string {
  const [year, month, day] = dateString.split('-').map(Number);
  // 0-indexed 月で加算 → 桁上がりを Date に任せず自前で正規化する。
  const totalMonth = (year * 12 + (month - 1) + months) as number;
  const nextYear = Math.floor(totalMonth / 12);
  const nextMonth = totalMonth % 12; // 0-indexed
  // 月末日を超えないよう clamp（例: 1/31 の 1 ヶ月後は 2/末）。
  const lastDay = daysInMonth(nextYear, nextMonth);
  const clampedDay = Math.min(day, lastDay);
  const mm = String(nextMonth + 1).padStart(2, '0');
  const dd = String(clampedDay).padStart(2, '0');
  return toDateStringJst(`${nextYear}-${mm}-${dd}`);
}

// year, month(0-indexed) の日数。
function daysInMonth(year: number, monthZeroBased: number): number {
  // 翌月 0 日 = 当月末日。UTC 基準で日数だけ求める純粋計算（TZ に依存しない）。
  return new Date(Date.UTC(year, monthZeroBased + 1, 0)).getUTCDate();
}
