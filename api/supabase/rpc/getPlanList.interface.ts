export const RPC_GET_PLAN_LIST = 'get_plan_list';

interface GetPlanListRpcRequest {
  input_user_id: string;
}

export type GetPlanListRpcRow = {
  id: number;
  start_date: string;
  end_date: string;
  name: string;
  memo: string | null;
  plan_type_id: number;
  plan_type_name: string;
  plan_type_color_classification_name: string;
  is_pair: boolean;
};
// TODO: interfaceに置き換える
type GetPlanListRpcResponse = GetPlanListRpcRow[] | null;

export interface GetPlanListRpc {
  Args: GetPlanListRpcRequest;
  Returns: GetPlanListRpcResponse;
}
