import type { ColorString, DatetimeString, DayString, DbDatetimeString } from './common';

export type SupabaseApiAuth = {
  isDemoLogin: boolean;
};
export type SupabaseApiAuthGet = {
  userUid: string;
} & SupabaseApiAuth;
export type SupabaseApiAuthUpsert = {
  isPair: boolean;
  pairId: number;
} & SupabaseApiAuthGet;

export type UpsertRecordInput = {
  id: number | null;
  datetime: DatetimeString;
  isPay: boolean;
  methodId: number;
  isInstead: boolean | null;
  typeId: number;
  subTypeId: number | null;
  price: number;
  memo: string | null;
};

export type GetRecordListRpc = {
  record_id: number;
  is_self: boolean;
  datetime: DbDatetimeString;
  is_pay: boolean;
  price: number;
  memo: string | null;
  is_instead: boolean;
  planned_record_id: number | null;
  method_id: number;
  method_name: string;
  method_color_classification_name: string;
  type_id: number;
  type_name: string;
  sub_type_id: number | null;
  sub_type_name: string | null;
  type_color_classification_name: string;
  is_pair: boolean;
  pair_user_name: string | null;
};

export type GetTypeSummaryRpc = {
  type_name: string;
  type_id: number;
  is_pair: boolean;
  sub_type_name: string;
  sub_type_id: number;
  color_name: string;
  sub_type_sum: number;
  sum: number;
};
export type GetTypeSummaryOutput = {
  type_name: string;
  type_id: number;
  is_pair: boolean;
  sub_type_name: string;
  sub_type_id: number;
  color_name: string;
  sub_type_sum: number;
  sum: number;
  sub_types: { sub_type_id: number; sub_type_name: string; sub_type_sum: number }[];
};
export type GetMethodSummaryRpc = {
  method_name: string;
  method_id: number;
  pair_user_name: string | null;
  color_name: string;
  is_pair: boolean;
  sum: number;
};
export type GetPayAndIncomeListRpc = {
  year_month: string;
  pay_sum: number;
  income_sum: number;
};
export type GetPairedRecordListRpc = {
  id: number;
  is_self: boolean | null;
  is_pay: boolean;
  price: number;
  memo: string | null;
  is_instead: boolean | null;
  is_settled: boolean | null;
  is_planned_record: boolean;
  method_name: string;
  method_color_classification_name: string;
  type_name: string;
  sub_type_name: string | null;
  type_color_classification_name: string;
};
export type GetColorListRpc = {
  id: number;
  name: string;
};
export type GetPlannedRecordListRpc = {
  planned_record_id: number;
  is_self: boolean | null;
  is_pay: boolean;
  price: number;
  memo: string | null;
  sort: number;
  updated_at: DbDatetimeString;
  is_pair: boolean;
  pair_user_name: string | null;
  day_classification_id: number;
  day_classification_name: DayString;
  method_id: number;
  method_name: string;
  method_color_classification_name: ColorString;
  type_id: number;
  type_name: string;
  type_color_classification_name: ColorString;
  sub_type_id: number | null;
  sub_type_name: string | null;
};
