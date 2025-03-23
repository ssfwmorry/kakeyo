import type { YearMonthString } from '@/utils/types/common';

export const RPC_GET_MONTH_SUM = 'get_month_sum';

interface GetMonthSumRpcRequest {
  input_user_id: string;
  input_year_month: YearMonthString;
}

export type GetMonthSumRpcRow = {
  year_month: YearMonthString;
  self_sum: number;
  pair_sum: number;
  both_sum: number;
};
// TODO: interfaceに置き換える
type GetMonthSumRpcResponse = GetMonthSumRpcRow[] | null;

export interface GetMonthSumRpc {
  Args: GetMonthSumRpcRequest;
  Returns: GetMonthSumRpcResponse;
}
