import type {
  ColorString,
  DateString,
  DatetimeString,
  DBDateString,
  DbDatetimeString,
  Id,
} from './common';

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
  // MEMO: Decamelized<> によりスネークケースにすると user_1_id になるので手動で定義必要
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

export type Method = {
  id: Id;
  userId: Id | null;
  pairId: Id | null;
  name: string;
  isPay: boolean | null;
  colorClassificationId: Id;
  sort: number;
};

export type SubType = {
  id: Id;
  typeId: Id;
  name: string;
  sort: number;
};

export const RecordType = {
  self: 0,
  instead: 5,
  pair: 10,
  settlement: 15,
} as const;
export type RecordType = (typeof RecordType)[keyof typeof RecordType];

export type Record_ = {
  id: Id;
  userId: string | null;
  pairId: Id | null;
  datetime: DatetimeString;
  isPay: boolean | null;
  methodId: Id;
  typeId: Id | null;
  subTypeId: Id | null;
  price: number;
  memo: string | null;
  plannedRecordId: Id | null;
  isSettled: boolean | null;
  recordType: RecordType;
};

export type ShortCut = {
  id: Id;
  userId: string | null;
  pairId: Id | null;
  isPay: boolean;
  methodId: Id;
  typeId: Id;
  subTypeId: Id | null;
  price: number;
  memo: string | null;
  recordType: RecordType;
};

export type Bank = {
  id: Id;
  userId: Id;
  name: string;
  colorClassificationId: Id;
};

export type BankBalance = {
  id: Id;
  bankId: Id;
  price: number;
  createdAt: DbDatetimeString;
};

export type Condition = {
  id: Id;
  month: number;
};

export const ReminderType = {
  flow: 5,
  stock: 10,
} as const;
export type ReminderType = (typeof ReminderType)[keyof typeof ReminderType];

export const BaseType = {
  now: 5,
  date: 10,
} as const;
export type BaseType = (typeof BaseType)[keyof typeof BaseType];

export type Reminder = {
  id: Id;
  userId: string | null;
  pairId: Id | null;
  name: string;
  reminderType: ReminderType;
  conditionId: Id;
  baseType: BaseType;
  date: DBDateString;
  memo: string | null;
  colorClassificationId: Id;
};
