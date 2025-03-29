import type { Id } from '@/utils/types/common';
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
  id: Id | null;
  dayClassificationId: Id;
  isPay: boolean;
  methodId: Id;
  isInstead: boolean | null;
  typeId: Id;
  subTypeId: Id | null;
  price: number;
  memo: string | null;
}
