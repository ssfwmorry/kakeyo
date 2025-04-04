import type { ColorString, DateString, DatetimeString, DbDatetimeString, Id } from './common';

export type ColorClassification = {
  id: Id;
  name: ColorString;
};

export type DayClassification = {
  id: Id;
  name: string;
  value: number;
};

export type Pair = {
  id: Id;
  user1Id: string;
  user2Id: string;
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
  planTypeId: Id;
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
