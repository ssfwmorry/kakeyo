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
import type { ApiOutput, InvalidArgumentError } from './common.interface';
import type { GetMethodSummaryRpcRow } from './rpc/getMethodSummary.interface';
import type { GetPairedRecordListRpcRow } from './rpc/getPairedRecordList.interface';
import type { GetPayAndIncomeListRpcRow } from './rpc/getPayAndIncomeList.interface';
import type { GetRecordListRpcRow } from './rpc/getRecordList.interface';
import type { GetSummarizedRecordListRpcRow } from './rpc/getSummarizedRecordList.interface';
import type { GetTypeSummaryRpcRow } from './rpc/getTypeSummary.interface';

export interface GetRecordListInput extends DateRange {}

export type GetRecordListItem = Camelized<Omit<GetRecordListRpcRow, 'record_id'>> & { id: Id };
export interface GetRecordListOutput extends ApiOutput<GetRecordListItem[], PostgrestError> {}

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
export interface SettleRecordsOutput
  extends ApiOutput<null, PostgrestError | InvalidArgumentError> {}

export interface PostRecordsInput {
  yearMonth: YearMonthString;
}
export interface PostRecordsOutput extends ApiOutput<null, PostgrestError> {}

export interface GetMonthSumInput {
  yearMonth: YearMonthString;
}
type GetMonthSumOutputData = { SELF: number; PAIR: number; BOTH: number };
export interface GetMonthSumOutput extends ApiOutput<GetMonthSumOutputData, PostgrestError> {}

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
export interface GetTypeSummaryOutput extends ApiOutput<GetTypeSummaryItem[], PostgrestError> {}

export interface GetMethodSummaryInput {
  isPay: boolean;
  isPair: boolean;
  isIncludeInstead: boolean;
  year: YearString;
  month: MonthString;
}
export type GetMethodSummaryItem = Camelized<GetMethodSummaryRpcRow>;
export interface GetMethodSummaryOutput extends ApiOutput<GetMethodSummaryItem[], PostgrestError> {}

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
export interface GetSummarizedRecordListOutput
  extends ApiOutput<GetSummarizedRecordItem[], PostgrestError> {}

export interface GetPairedRecordListInput {
  yearMonth: YearMonthString;
}
export type GetPairedRecordItem = Camelized<GetPairedRecordListRpcRow>;
export interface GetPairedRecordListOutput
  extends ApiOutput<GetPairedRecordItem[], PostgrestError> {}

export interface GetPayAndIncomeListInput {
  year: YearString;
  isPair: boolean;
  isIncludeInstead: boolean;
}
export type GetPayAndIncomeItem = Camelized<GetPayAndIncomeListRpcRow>;
export interface GetPayAndIncomeListOutput
  extends ApiOutput<GetPayAndIncomeItem[], PostgrestError> {}
