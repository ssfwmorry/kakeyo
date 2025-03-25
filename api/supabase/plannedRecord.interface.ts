import type { PostgrestError } from '@supabase/supabase-js';
import type { Camelized } from 'humps';
import type { GetPlannedRecordListRpcRow } from './rpc/getPlannedRecordList.interface';

export type GetPlannedRecordListItem = Camelized<GetPlannedRecordListRpcRow>;
export interface GetPlannedRecordListOutput {
  data: {
    self: GetPlannedRecordListItem[];
    pair: GetPlannedRecordListItem[];
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
