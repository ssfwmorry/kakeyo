import {
  dateInMonthJst,
  endOfDayJst,
  startOfDayJst
} from '@/lib/shared/domain/date';

// カレンダー表示範囲の計算（純粋関数）。旧 useCalendarStore.updateRange の payload2 を移植。
// dayGridMonth は前後の月の日も一部見えるため、record/plan を「前月21日〜翌月9日」で
// まとめて取得し、当月の枠外セルにも収支を出せるようにする。
//
// JST 境界の算出は date.ts（日付の単一の正）へ委譲する（dayjs は直 import しない）。
// record 取得は Date（両端含む gte..lte）、plan 取得は YYYY-MM-DD 文字列を要求するため
// 両形式を用意する。

// 表示範囲端の定義（当月 = yearMonth に対して）。
const START_MONTH_OFFSET = -1;
const START_DAY = 21;
const END_MONTH_OFFSET = 1;
const END_DAY = 9;

export type CalendarRange = {
  // record 取得用（getRecordListForRange は Date を要求）。
  startDate: Date;
  endDate: Date;
  // plan 取得用（getPlanList は YYYY-MM-DD 文字列を要求）。
  startStr: string;
  endStr: string;
};

// yearMonth（YYYY-MM）から表示範囲を計算する。
// start = 前月21日 00:00(JST)、end = 翌月9日 23:59:59(JST)。
export function calcCalendarRange(yearMonth: string): CalendarRange {
  const startStr = dateInMonthJst(yearMonth, START_MONTH_OFFSET, START_DAY);
  const endStr = dateInMonthJst(yearMonth, END_MONTH_OFFSET, END_DAY);
  return {
    startDate: startOfDayJst(startStr),
    endDate: endOfDayJst(endStr),
    startStr,
    endStr
  };
}
