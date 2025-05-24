import type { Id, YearString } from '@/utils/types/common';

export const RPC_GET_SUB_TYPE_SUMMARY = 'get_sub_type_summary';

interface GetSubTypeSummaryRpcRequest {
  input_year: YearString;
  input_type_id: Id;
}

export type GetSubTypeSummaryRpcRow = {
  year_month: string;
  type_id: Id;
  type_name: string;
  type_color_classification_name: string;
  sub_type_id: Id | null;
  sub_type_name: string | null;
  sum: number;
};
// TODO: interfaceに置き換える
type GetSubTypeSummaryRpcResponse = GetSubTypeSummaryRpcRow[] | null;

export interface GetSubTypeSummaryRpc {
  Args: GetSubTypeSummaryRpcRequest;
  Returns: GetSubTypeSummaryRpcResponse;
}
