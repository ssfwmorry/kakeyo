import type { Id } from '~/utils/types/common';

export const RPC_GET_PLANNED_RECORD_LIST = 'get_planned_record_list';

interface GetPlannedRecordListRpcRequest {
  input_user_id: string;
}

export type GetPlannedRecordListRpcRow = {
  planned_record_id: Id;
  is_self: boolean;
  is_pay: boolean;
  price: number;
  memo: string | null;
  sort: number;
  updated_at: string;
  is_pair: boolean;
  pair_user_name: string | null;
  day_classification_id: Id;
  day_classification_name: string;
  method_id: Id;
  method_name: string;
  method_color_classification_name: string;
  type_id: Id;
  type_name: string;
  type_color_classification_name: string;
  sub_type_id: Id | null;
  sub_type_name: string | null;
};
// TODO: interfaceに置き換える
type GetPlannedRecordListRpcResponse = GetPlannedRecordListRpcRow[] | null;

export interface GetPlannedRecordListRpc {
  Args: GetPlannedRecordListRpcRequest;
  Returns: GetPlannedRecordListRpcResponse;
}
