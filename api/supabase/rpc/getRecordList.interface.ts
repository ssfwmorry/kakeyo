import type { DbDatetimeString, Id } from '@/utils/types/common';
import type { RecordType } from '@/utils/types/model';

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
  is_pay: boolean | null;
  price: number;
  memo: string | null;
  record_type: RecordType;
  planned_record_id: Id | null;
  method_id: Id;
  method_name: string;
  method_color_classification_name: string;
  type_id: Id | null;
  type_name: string | null;
  sub_type_id: Id | null;
  sub_type_name: string | null;
  type_color_classification_name: string | null;
  is_pair: boolean;
  pair_user_name: string | null;
};
// TODO: interfaceに置き換える
type GetRecordListRpcResponse = GetRecordListRpcRow[] | null;

export interface GetRecordListRpc {
  Args: GetRecordListRpcRequest;
  Returns: GetRecordListRpcResponse;
}
