import type {
  DateRange,
  DatetimeString,
  Id,
  MonthString,
  YearMonthString,
  YearString,
} from '@/utils/types/common';
import type { PostgrestError } from '@supabase/supabase-js';
import type { Camelized } from 'humps';
import type { GetMethodSummaryRpcRow } from './rpc/getMethodSummary.interface';
import type { GetPairedRecordListRpcRow } from './rpc/getPairedRecordList.interface';
import type { GetPayAndIncomeListRpcRow } from './rpc/getPayAndIncomeList.interface';
import type { GetRecordListRpcRow } from './rpc/getRecordList.interface';
import type { GetSummarizedRecordListRpcRow } from './rpc/getSummarizedRecordList.interface';
import type { GetTypeSummaryRpcRow } from './rpc/getTypeSummary.interface';

export interface GetRecordListInput extends DateRange {}

export type GetRecordListItem = Camelized<Omit<GetRecordListRpcRow, 'record_id'>> & { id: Id };
export interface GetRecordListOutput {
  data: GetRecordListItem[];
  error: PostgrestError | null;
  message: string;
}

export interface UpsertRecordInput {
  id: Id | null;
  datetime: DatetimeString;
  isPay: boolean;
  methodId: Id;
  isInstead: boolean | null;
  typeId: Id;
  subTypeId: Id | null;
  price: number;
  memo: string | null;
}

export interface SettleRecordsInput {
  ids: Id[];
}
export interface SettleRecordsOutput {
  data: null;
  error: PostgrestError | string | null;
  message: string;
}

export interface PostRecordsInput {
  yearMonth: YearMonthString;
}
export interface PostRecordsOutput {
  data: null;
  error: PostgrestError | null;
  message: string;
}

export interface GetMonthSumInput {
  yearMonth: YearMonthString;
}
export interface GetMonthSumOutput {
  data: { SELF: number; PAIR: number; BOTH: number };
  error: PostgrestError | null;
  message: string;
}

export interface GetTypeSummaryInput {
  isPay: boolean;
  isPair: boolean;
  isIncludeInstead: boolean;
  year: YearString;
  month: MonthString;
}

export type GetTypeSummaryItemSubTypeListItem = {
  subTypeId: Id;
  subTypeName: string;
  subTypeSum: number;
};
export type GetTypeSummaryItem = Camelized<GetTypeSummaryRpcRow> & {
  subTypes: GetTypeSummaryItemSubTypeListItem[];
};
export interface GetTypeSummaryOutput {
  data: GetTypeSummaryItem[];
  error: PostgrestError | null;
  message: string;
}

export interface GetMethodSummaryInput {
  isPay: boolean;
  isPair: boolean;
  isIncludeInstead: boolean;
  year: YearString;
  month: MonthString;
}
export type GetMethodSummaryItem = Camelized<GetMethodSummaryRpcRow>;
export interface GetMethodSummaryOutput {
  data: GetMethodSummaryItem[];
  error: PostgrestError | null;
  message: string;
}

export interface GetSummarizedRecordListInput {
  isPay: boolean;
  isType: boolean;
  isPair: boolean;
  isIncludeInstead: boolean;
  yearMonth: YearMonthString;
  id: Id;
  subtypeId: Id | null;
}
export type GetSummarizedRecordItem = Camelized<
  Omit<GetSummarizedRecordListRpcRow, 'record_id'>
> & { id: Id };
export interface GetSummarizedRecordListOutput {
  data: GetSummarizedRecordItem[];
  error: PostgrestError | null;
  message: string;
}

export interface GetPairedRecordListInput {
  yearMonth: YearMonthString;
}
export type GetPairedRecordItem = Camelized<GetPairedRecordListRpcRow>;
export interface GetPairedRecordListOutput {
  data: GetPairedRecordItem[];
  error: PostgrestError | null;
  message: string;
}

export interface GetPayAndIncomeListInput {
  year: YearString;
  isPair: boolean;
  isIncludeInstead: boolean;
}
export type GetPayAndIncomeItem = Camelized<GetPayAndIncomeListRpcRow>;
export interface GetPayAndIncomeListOutput {
  data: GetPayAndIncomeItem[];
  error: PostgrestError | null;
  message: string;
}
