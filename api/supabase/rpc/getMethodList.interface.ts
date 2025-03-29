import type { Id } from '@/utils/types/common';

export const RPC_GET_METHOD_LIST = 'get_method_list';

interface GetMethodListRpcRequest {
  input_user_id: string;
}

export type GetMethodListRpcRow = {
  id: Id;
  name: string;
  is_pay: boolean;
  sort: number;
  color_classification_id: Id;
  color_classification_name: string;
  is_pair: boolean;
};
// TODO: interfaceに置き換える
type GetMethodListRpcResponse = GetMethodListRpcRow[] | null;

export interface GetMethodListRpc {
  Args: GetMethodListRpcRequest;
  Returns: GetMethodListRpcResponse;
}
