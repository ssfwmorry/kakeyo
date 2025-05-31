import type { ColorString, Id, YearString } from '@/utils/types/common';

export const RPC_GET_TYPE_SUMMARY_PERIOD = 'get_type_summary_period';

interface GetTypeSummaryPeriodRpcRequest {
  input_user_id: string;
  input_year: YearString;
  input_is_pay: boolean;
  input_is_pair: boolean;
}

export type GetTypeSummaryPeriodRpcRow = {
  year_month: string;
  type_id: Id | null;
  type_name: string | null;
  type_color_classification_name: ColorString | null;
  sum: number;
};
// TODO: interfaceに置き換える
type GetTypeSummaryPeriodRpcResponse = GetTypeSummaryPeriodRpcRow[] | null;

export interface GetTypeSummaryPeriodRpc {
  Args: GetTypeSummaryPeriodRpcRequest;
  Returns: GetTypeSummaryPeriodRpcResponse;
}
