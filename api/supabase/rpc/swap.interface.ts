export const RPC_SWAP_METHOD = 'swap_method';
export const RPC_SWAP_PLANNED_RECORD = 'swap_planned_record';
export const RPC_SWAP_PLAN_TYPE = 'swap_plan_type';
export const RPC_SWAP_SUB_TYPE = 'swap_sub_type';
export const RPC_SWAP_TYPE = 'swap_type';

interface SwapRpcRequest {
  id1: number;
  id2: number;
}

// TODO: interfaceに置き換える
type SwapRpcResponse = null;

export interface SwapRpc {
  Args: SwapRpcRequest;
  Returns: SwapRpcResponse;
}
