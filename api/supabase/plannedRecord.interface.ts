import type { PostgrestError } from '@supabase/supabase-js';
import type { Camelized } from 'humps';
import type { Id } from '~/utils/types/common';
import type { ApiOutput } from './common.interface';
import type { GetPlannedRecordListRpcRow } from './rpc/getPlannedRecordList.interface';

export type GetPlannedRecordListItem = Camelized<GetPlannedRecordListRpcRow>;
export type GetPlannedRecordListOutputData = {
  self: GetPlannedRecordListItem[];
  pair: GetPlannedRecordListItem[];
};
export interface GetPlannedRecordListOutput
  extends ApiOutput<GetPlannedRecordListOutputData, PostgrestError> {}

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
