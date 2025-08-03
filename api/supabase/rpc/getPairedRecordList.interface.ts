import type { DbDatetimeString, Id, YearMonthString } from '~/utils/types/common';
import type { RecordType } from '~/utils/types/model';

export const RPC_GET_PAIRED_RECORD_LIST = 'get_paired_record_list';

interface GetPairedRecordListRpcRequest {
  input_user_id: string;
  input_year_month: YearMonthString;
}

export type GetPairedRecordListRpcRow = {
  id: Id;
  datetime: DbDatetimeString;
  is_self: boolean | null;
  is_pay: boolean | null;
  price: number;
  memo: string | null;
  record_type: RecordType;
  is_settled: boolean | null;
  is_planned_record: boolean;
  method_name: string;
  method_color_classification_name: string;
  type_name: string | null;
  sub_type_name: string | null;
  type_color_classification_name: string | null;
};
// TODO: interfaceに置き換える
type GetPairedRecordListRpcResponse = GetPairedRecordListRpcRow[] | null;

export interface GetPairedRecordListRpc {
  Args: GetPairedRecordListRpcRequest;
  Returns: GetPairedRecordListRpcResponse;
}
