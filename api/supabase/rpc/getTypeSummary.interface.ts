import type { Id, MonthString, YearString } from '@/utils/types/common';

export const RPC_GET_TYPE_SUMMARY = 'get_type_summary';

interface GetTypeSummaryRpcRequest {
  input_user_id: string;
  input_is_pay: boolean;
  input_is_pair: boolean;
  input_is_include_instead: boolean;
  input_year: YearString;
  input_month: MonthString;
}

export type GetTypeSummaryRpcRow = {
  type_name: string;
  type_id: Id;
  is_pair: boolean;
  sub_type_name: string;
  sub_type_id: Id;
  color_name: string;
  sub_type_sum: number;
  sum: number;
};
// TODO: interfaceに置き換える
type GetTypeSummaryRpcResponse = GetTypeSummaryRpcRow[] | null;

export interface GetTypeSummaryRpc {
  Args: GetTypeSummaryRpcRequest;
  Returns: GetTypeSummaryRpcResponse;
}
