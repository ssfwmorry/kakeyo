import type { Id } from '~/utils/types/common';

export const RPC_GET_PLAN_TYPE_LIST = 'get_plan_type_list';

interface GetPlanTypeListRpcRequest {
  input_user_id: string;
}

export type GetPlanTypeListRpcRow = {
  plan_type_id: Id;
  plan_type_name: string;
  sort: number;
  color_classification_id: Id;
  color_classification_name: string;
  is_pair: boolean;
};
// TODO: interfaceに置き換える
export type GetPlanTypeListRpcResponse = GetPlanTypeListRpcRow[] | null;

export interface GetPlanTypeListRpc {
  Args: GetPlanTypeListRpcRequest;
  Returns: GetPlanTypeListRpcResponse;
}
