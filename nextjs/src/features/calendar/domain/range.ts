import {
  dateInMonthJst,
  endOfDayJst,
  startOfDayJst
} from '@/lib/shared/domain/date';

// dayGridMonth は前後の月の日も一部見えるため、record/plan を「前月21日〜翌月9日」で
// まとめて取得し、当月の枠外セルにも収支を出せるようにする。
// record 取得は Date（両端含む gte..lte）、plan 取得は YYYY-MM-DD 文字列を要求するため
// 両形式を用意する。

const START_MONTH_OFFSET = -1;
const START_DAY = 21;
const END_MONTH_OFFSET = 1;
const END_DAY = 9;

export type CalendarRange = {
  // record 取得用（Date を要求）。
  startDate: Date;
  endDate: Date;
  // plan 取得用（YYYY-MM-DD 文字列を要求）。
  startStr: string;
  endStr: string;
};

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
