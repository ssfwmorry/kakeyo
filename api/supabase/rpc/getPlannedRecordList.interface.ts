export const RPC_GET_PLANNED_RECORD_LIST = 'get_planned_record_list';

interface GetPlannedRecordListRpcRequest {
  input_user_id: string;
}

export type GetPlannedRecordListRpcRow = {
  planned_record_id: number;
  is_self: boolean;
  is_pay: boolean;
  price: number;
  memo: string | null;
  sort: number;
  updated_at: string;
  is_pair: boolean;
  pair_user_name: string | null;
  day_classification_id: number;
  day_classification_name: string;
  method_id: number;
  method_name: string;
  method_color_classification_name: string;
  type_id: number;
  type_name: string;
  type_color_classification_name: string;
  sub_type_id: number | null;
  sub_type_name: string | null;
};
// TODO: interfaceに置き換える
type GetPlannedRecordListRpcResponse = GetPlannedRecordListRpcRow[] | null;

export interface GetPlannedRecordListRpc {
  Args: GetPlannedRecordListRpcRequest;
  Returns: GetPlannedRecordListRpcResponse;
}
