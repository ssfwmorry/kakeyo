import type { ColorCode } from '../constants/color';

export type Id = number;
export type ColorString = ColorCode;
/** YYYY */
export type YearString = string;
/** MM */
export type MonthString = string;
/** 毎月 DD 日 */
export type DayString = string;
/** YYYY-MM */
export type YearMonthString = string;
/** YYYY-MM-DD */
export type DateString = string;
/** YYYY-MM-DD HH:MM:SS */
export type DatetimeString = string;
/** ex..2024-12-31T20:06:38+09:00 */
export type DbDatetimeString = string;
/** YYYY-MM */
export type DBDateString = string;
/** {year: YYYY, month: MM} */
export type YearMonthObj = { year: YearString; month: MonthString };
/** {year: YYYY, month: MM} */
export type YearMonthNumObj = { year: number; month: number };

export const BoolString = {
  TRUE: 'true',
  FALSE: 'false',
} as const;
export type BoolString = (typeof BoolString)[keyof typeof BoolString];

export const OrderBy = {
  ASC: 'asc',
  DESC: 'desc',
} as const;
export type OrderBy = (typeof OrderBy)[keyof typeof OrderBy];

export type PickedDate = {
  $y: number;
  $M: number;
  $D: number;
};

export type DateRange = {
  start: DateString;
  end: DateString;
};
