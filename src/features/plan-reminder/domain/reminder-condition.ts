// リマインダーの繰り返し条件（rule）の型・パース・次回日付計算（純粋関数）。
// SSR 事故防止のため日付は @/lib/shared/domain/date.ts 経由でのみ扱う（dayjs 直 import 禁止）。
//
// rule は DB に jsonb で持つ。DB 側で形を保証できないため、読み出し境界で必ず
// parseReminderRule を通し、壊れていれば null 扱いにする。

import { z } from 'zod';
import type { Nth, Weekday } from '@/lib/shared/domain/date';
import {
  addDaysJst,
  addMonthsClampJst,
  addMonthsOverflowJst,
  addMonthsToYearMonthJst,
  lastDayOfMonthJst,
  nthWeekdayOfMonthJst,
  weekdayJst
} from '@/lib/shared/domain/date';

// 曜日・週番号は暦の概念なので date.ts が正。rule の形を読む側が
// plan-reminder から一式 import できるよう、ここから re-export する。
export type { Nth, Weekday } from '@/lib/shared/domain/date';

const weekdaySchema = z.literal([0, 1, 2, 3, 4, 5, 6]);
const nthSchema = z.literal([1, 2, 3, 4, 5, 'last']);

// kind の文字列が条件型の唯一の正。
export const reminderRuleSchema = z.discriminatedUnion('kind', [
  // N 週間ごとの M 曜日（interval=1 で毎週）。
  z.object({
    kind: z.literal('week'),
    interval: z.int().min(1).max(52),
    weekday: weekdaySchema
  }),
  // 第 N M 曜日。nths は複数可（第 2・第 4 水曜 = { nths: [2, 4], weekday: 3 }）。
  z.object({
    kind: z.literal('nthWeek'),
    nths: z.array(nthSchema).min(1).transform(normalizeNths),
    weekday: weekdaySchema
  }),
  // X ヶ月ごとの Y 日（interval=1 で毎月）。
  z.object({
    kind: z.literal('month'),
    interval: z.int().min(1).max(36),
    day: z.int().min(1).max(31)
  }),
  // X ヶ月ごとの月末。
  z.object({
    kind: z.literal('monthEnd'),
    interval: z.int().min(1).max(36)
  }),
  // 毎年 M 月 D 日。
  z.object({
    kind: z.literal('year'),
    month: z.int().min(1).max(12),
    day: z.int().min(1).max(31)
  }),
  // ＋N ヶ月後（チェックした日から数える先送り）。
  z.object({
    kind: z.literal('afterCheck'),
    months: z.int().min(1).max(36)
  })
]);

export type ReminderRule = z.infer<typeof reminderRuleSchema>;

// nths は昇順かつ一意に正規化する（'last' は常に末尾）。保存時・パース時の両方を通す。
function normalizeNths(nths: Nth[]): Nth[] {
  const unique = [...new Set(nths)];
  const numbers = unique
    .filter((nth): nth is Exclude<Nth, 'last'> => nth !== 'last')
    .sort((a, b) => a - b);
  return unique.includes('last') ? [...numbers, 'last'] : numbers;
}

// 壊れていれば null（呼び出し側が nextDate: null に落とす）。
export function parseReminderRule(value: unknown): ReminderRule | null {
  const parsed = reminderRuleSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export type NextDateInput = {
  rule: ReminderRule | null;
  // reminders.date（前回の日付）。YYYY-MM-DD。interval 系はここを基準に進める。
  currentDate: string;
  // 「今日」（純粋化のため呼び出し側で注入必須。テスト容易性も兼ねる）。
  today: string;
};

// 次回日付を YYYY-MM-DD（JST 日付境界）で返す。rule が壊れていれば null。
//
// afterCheck 以外は「date から 1 ステップ進める → today 以下ならもう 1 ステップ」の
// ループにする。長期放置したあとにチェックしても過去日へ進まないようにするため。
// afterCheck は繰り返しではなく先送りなので today 基準の単発計算でループしない。
export function calcNextReminderDate(input: NextDateInput): string | null {
  const { rule, currentDate, today } = input;
  if (rule === null) {
    return null;
  }

  if (rule.kind === 'afterCheck') {
    return addMonthsOverflowJst(today, rule.months);
  }

  let date = currentDate;
  // 進まない rule（想定外）で無限ループしないよう上限を置く。
  for (let i = 0; i < MAX_STEPS; i++) {
    const next = stepOnce(rule, date);
    if (next === null || next <= date) {
      return null;
    }
    date = next;
    if (date > today) {
      return date;
    }
  }
  return null;
}

// today を大きく過ぎた rule でも届く十分な回数（毎週 = 約 19 年分）。
const MAX_STEPS = 1000;

// 進めない場合は null。
function stepOnce(
  rule: Exclude<ReminderRule, { kind: 'afterCheck' }>,
  date: string
): string | null {
  switch (rule.kind) {
    case 'week': {
      // interval 週進めたうえで、その週の weekday にスナップする。
      const shifted = addDaysJst(date, rule.interval * 7);
      return addDaysJst(shifted, rule.weekday - weekdayJst(shifted));
    }
    case 'nthWeek':
      return nextNthWeekday(rule.nths, rule.weekday, date);
    case 'month':
      return addMonthsClampJst(date, rule.interval, rule.day);
    case 'monthEnd':
      return lastDayOfMonthJst(addMonthsClampJst(date, rule.interval, 1));
    case 'year': {
      const year = Number(date.slice(0, 4)) + 1;
      return addMonthsClampJst(
        `${year}-${String(rule.month).padStart(2, '0')}-01`,
        0,
        rule.day
      );
    }
  }
}

// nths を当月で全て日付に展開し、date より後の最小を選ぶ。
// 無ければ翌月へ送って同じことをする（第 5 週が無い月は候補が空になり送られる）。
function nextNthWeekday(
  nths: Nth[],
  weekday: Weekday,
  date: string
): string | null {
  let yearMonth = date.slice(0, 7);
  // nths: [5] だけの指定が第 5 週のある月まで飛ぶため、複数月を見る。
  for (let i = 0; i < NTH_WEEK_LOOKAHEAD_MONTHS; i++) {
    const candidates = nths
      .map((nth) => nthWeekdayOfMonthJst(yearMonth, nth, weekday))
      .filter((candidate): candidate is string => candidate !== null)
      .filter((candidate) => candidate > date)
      .sort();
    if (candidates.length > 0) {
      return candidates[0];
    }
    yearMonth = addMonthsToYearMonthJst(yearMonth, 1);
  }
  return null;
}

// 第 5 週のみ指定でも必ず届く月数。第 5 週が無い月は最長 3 ヶ月しか連続しないので
// 4 で足りるが、閏の並び次第の値なので余裕を持たせる。
const NTH_WEEK_LOOKAHEAD_MONTHS = 6;
