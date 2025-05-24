import type { Id, YearString } from '@/utils/types/common';

export const RPC_GET_TYPE_SUMMARIZED_RECORD_LIST = 'get_type_summarized_record_list';

interface GetTypeSummarizedRecordListRpcRequest {
  input_year: YearString;
  input_type_id: Id;
}

export type GetTypeSummarizedRecordListRpcRow = {
  year_month: string;
  type_id: Id;
  type_name: string;
  type_color_classification_name: string;
  subtype_id: Id | null;
  subtype_name: string | null;
  sum: number;
};
// TODO: interfaceに置き換える
type GetTypeSummarizedRecordListRpcResponse = GetTypeSummarizedRecordListRpcRow[] | null;

export interface GetTypeSummarizedRecordListRpc {
  Args: GetTypeSummarizedRecordListRpcRequest;
  Returns: GetTypeSummarizedRecordListRpcResponse;
}
