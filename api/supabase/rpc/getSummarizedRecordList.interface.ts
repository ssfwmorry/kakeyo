import type { DatetimeString, Id, YearMonthString } from '@/utils/types/common';
import type { RecordType } from '@/utils/types/model';

export const RPC_GET_SUMMARIZED_RECORD_LIST = 'get_summarized_record_list';

interface GetSummarizedRecordListRpcRequest {
  input_user_id: string;
  input_is_pay: boolean;
  input_is_type: boolean;
  input_is_pair: boolean;
  input_is_include_instead: boolean;
  input_year_month: YearMonthString;
  input_id: Id;
  input_sub_type_id: Id | null;
}

export type GetSummarizedRecordListRpcRow = {
  record_id: Id;
  is_self: boolean;
  datetime: DatetimeString;
  is_pay: boolean;
  price: number;
  memo: string | null;
  record_type: RecordType;
  planned_record_id: Id | null;
  method_id: Id;
  method_name: string;
  method_color_classification_name: string;
  type_id: Id;
  type_name: string;
  sub_type_id: Id | null;
  sub_type_name: string;
  type_color_classification_name: string;
  is_pair: boolean;
  pair_user_name: string | null;
};
// TODO: interfaceに置き換える
type GetSummarizedRecordListRpcResponse = GetSummarizedRecordListRpcRow[] | null;

export interface GetSummarizedRecordListRpc {
  Args: GetSummarizedRecordListRpcRequest;
  Returns: GetSummarizedRecordListRpcResponse;
}
