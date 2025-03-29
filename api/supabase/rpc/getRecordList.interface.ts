import type { DbDatetimeString, Id } from '@/utils/types/common';

export const RPC_GET_RECORD_LIST = 'get_record_list';

interface GetRecordListRpcRequest {
  input_user_id: string;
  input_start_datetime: string;
  input_end_datetime: string;
}

export type GetRecordListRpcRow = {
  record_id: Id;
  is_self: boolean;
  datetime: DbDatetimeString;
  is_pay: boolean;
  price: number;
  memo: string | null;
  is_instead: boolean | null;
  planned_record_id: Id | null;
  method_id: Id;
  method_name: string;
  method_color_classification_name: string;
  type_id: Id;
  type_name: string;
  sub_type_id: Id | null;
  sub_type_name: string | null;
  type_color_classification_name: string;
  is_pair: boolean;
  pair_user_name: string | null;
};
// TODO: interfaceに置き換える
type GetRecordListRpcResponse = GetRecordListRpcRow[] | null;

export interface GetRecordListRpc {
  Args: GetRecordListRpcRequest;
  Returns: GetRecordListRpcResponse;
}
