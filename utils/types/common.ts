export type Id = number;
export type ColorString = string; // TODO: あらかじめ決められた文字列のみを許可する
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
/** {year: YYYY, month: MM} */
export type YearMonthObj = { year: YearString; month: MonthString };

export const BoolString = {
  TRUE: 'true',
  FALSE: 'false',
} as const;
export type BoolString = (typeof BoolString)[keyof typeof BoolString];

export type PickedDate = {
  $y: number;
  $M: number;
  $D: number;
};

export type DateRange = {
  start: DateString;
  end: DateString;
};

export const ShareType = {
  SELF: 'SELF',
  PAIR: 'PAIR',
  BOTH: 'BOTH',
} as const;
export type ShareType = (typeof ShareType)[keyof typeof ShareType];
