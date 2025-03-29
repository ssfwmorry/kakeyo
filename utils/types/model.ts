import type { DateString, DatetimeString, DbDatetimeString, Id } from './common';

export type ColorClassification = {
  id: Id;
  name: string;
};

export type DayClassification = {
  id: Id;
  name: string;
  value: number;
};

export type Memo = {
  id: Id;
  userId: Id | null;
  pairId: Id | null;
  memo: string;
};

export type PlannedRecord = {
  id: Id;
  userId: Id | null;
  pairId: Id | null;
  dayClassificationId: Id;
  isPay: boolean;
  methodId: Id;
  typeId: Id;
  subTypeId: Id | null;
  price: number;
  memo: string | null;
  updatedAt: DbDatetimeString; // Date
};

export type Plan = {
  id: Id;
  userId: Id | null;
  pairId: Id | null;
  startDate: DateString;
  endDate: DateString;
  planTypeId: number;
  name: string;
  memo: string | null;
};

export type Record_ = {
  id: Id;
  userId: Id | null;
  pairId: Id | null;
  datetime: DatetimeString;
  isPay: boolean;
  methodId: Id;
  typeId: Id;
  subTypeId: Id | null;
  price: number;
  memo: string | null;
  plannedRecordId: Id | null;
  isInstead: boolean | null;
  isSettled: boolean | null;
};
