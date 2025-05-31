import type { ColorString, Id } from '@/utils/types/common';

export const RPC_GET_TYPE_LIST = 'get_type_list';

interface GetTypeListRpcRequest {
  input_user_id: string;
}

export type GetTypeListRpcRow = {
  type_id: Id;
  type_name: string;
  is_pay: boolean;
  type_sort: number;
  color_classification_id: Id;
  color_classification_name: ColorString;
  is_pair: boolean;
  sub_type_id: Id | null;
  sub_type_name: string | null;
  sub_type_sort: number | null;
};
// TODO: interfaceに置き換える
type GetTypeListRpcResponse = GetTypeListRpcRow[] | null;

export interface GetTypeListRpc {
  Args: GetTypeListRpcRequest;
  Returns: GetTypeListRpcResponse;
}
