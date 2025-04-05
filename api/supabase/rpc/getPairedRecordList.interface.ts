import type { DbDatetimeString, Id, YearMonthString } from '@/utils/types/common';

export const RPC_GET_PAIRED_RECORD_LIST = 'get_paired_record_list';

interface GetPairedRecordListRpcRequest {
  input_user_id: string;
  input_year_month: YearMonthString;
}

export type GetPairedRecordListRpcRow = {
  id: Id;
  datetime: DbDatetimeString;
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
// TODO: interfaceに置き換える
type GetPairedRecordListRpcResponse = GetPairedRecordListRpcRow[] | null;

export interface GetPairedRecordListRpc {
  Args: GetPairedRecordListRpcRequest;
  Returns: GetPairedRecordListRpcResponse;
}
