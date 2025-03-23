import type { PostgrestError } from '@supabase/supabase-js';
import type { GetPlannedRecordListRpcRow } from './rpc/getPlannedRecordList.interface';

export interface GetPlannedRecordListOutput {
  data: {
    self: GetPlannedRecordListRpcRow[];
    pair: GetPlannedRecordListRpcRow[];
  };
  error: PostgrestError | null;
  message: string;
}

export interface UpsertPlannedRecordInput {
  id: number | null;
  dayClassificationId: number;
  isPay: boolean;
  methodId: number;
  isInstead: boolean | null;
  typeId: number;
  subTypeId: number | null;
  price: number;
  memo: string | null;
}
