import type { DbDatetimeString, Id } from './common';

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
