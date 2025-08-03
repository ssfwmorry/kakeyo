import type { ColorString, Id, MonthString, YearString } from '~/utils/types/common';

export const RPC_GET_TYPE_SUMMARY = 'get_type_summary';

interface GetTypeSummaryRpcRequest {
  input_user_id: string;
  input_is_pay: boolean;
  input_is_pair: boolean;
  input_is_include_instead: boolean;
  input_year: YearString;
  input_month: MonthString;
}

export type GetTypeSummaryRpcRow =
  /** 通常 record */
  | {
      type_name: string;
      type_id: Id;
      is_pair: boolean;
      sub_type_name: string | null;
      sub_type_id: Id | null;
      color_name: ColorString;
      sub_type_sum: number | null;
      sum: number;
    }
  /** 精算 record */
  | {
      type_name: null;
      type_id: null;
      is_pair: true;
      sub_type_name: null;
      sub_type_id: null;
      color_name: null;
      sub_type_sum: null;
      sum: number;
    };
// TODO: interfaceに置き換える
type GetTypeSummaryRpcResponse = GetTypeSummaryRpcRow[] | null;

export interface GetTypeSummaryRpc {
  Args: GetTypeSummaryRpcRequest;
  Returns: GetTypeSummaryRpcResponse;
}
