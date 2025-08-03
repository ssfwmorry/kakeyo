import type { YearMonthString } from '~/utils/types/common';

export const RPC_POST_RECORDS = 'post_records';

interface PostRecordsRpcRequest {
  input_user_id: string;
  input_year_month: YearMonthString;
}

// TODO: interfaceに置き換える
type PostRecordsResponse = null;

export interface PostRecordsRpc {
  Args: PostRecordsRpcRequest;
  Returns: PostRecordsResponse;
}
