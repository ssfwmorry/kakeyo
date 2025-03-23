import type { MonthString, YearString } from '@/utils/types/common';

export const RPC_GET_METHOD_SUMMARY = 'get_method_summary';

interface GetMethodSummaryRpcRequest {
  input_user_id: string;
  input_is_pay: boolean;
  input_is_pair: boolean;
  input_is_include_instead: boolean;
  input_year: YearString;
  input_month: MonthString;
}

export type GetMethodSummaryRpcRow = {
  method_name: string;
  method_id: number;
  pair_user_name: string | null;
  color_name: string;
  is_pair: boolean;
  sum: number;
};
// TODO: interfaceに置き換える
type GetMethodSummaryRpcResponse = GetMethodSummaryRpcRow[] | null;

export interface GetMethodSummaryRpc {
  Args: GetMethodSummaryRpcRequest;
  Returns: GetMethodSummaryRpcResponse;
}
