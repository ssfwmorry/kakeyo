import type { YearString } from '~/utils/types/common';

export const RPC_GET_PAY_AND_INCOME_LIST = 'get_pay_and_income_list';

interface GetPayAndIncomeListRpcRequest {
  input_user_id: string;
  input_year: YearString;
  input_is_pair: boolean;
  input_is_include_instead: boolean;
}

export type GetPayAndIncomeListRpcRow = {
  year_month: string;
  pay_sum: number;
  income_sum: number;
};
// TODO: interfaceに置き換える
type GetPayAndIncomeListRpcResponse = GetPayAndIncomeListRpcRow[] | null;

export interface GetPayAndIncomeListRpc {
  Args: GetPayAndIncomeListRpcRequest;
  Returns: GetPayAndIncomeListRpcResponse;
}
