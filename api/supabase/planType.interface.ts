import type { PostgrestError } from '@supabase/supabase-js';
import type { Camelized } from 'humps';
import type { Id } from '~/utils/types/common';
import type { ApiOutput } from './common.interface';
import type { GetPlanTypeListRpcRow } from './rpc/getPlanTypeList.interface';

export type GetPlanTypeListItem = Camelized<GetPlanTypeListRpcRow>;
export type GetPlanTypeListOutputData = {
  self: GetPlanTypeListItem[];
  pair: GetPlanTypeListItem[];
};

export interface GetPlanTypeListOutput
  extends ApiOutput<GetPlanTypeListOutputData, PostgrestError> {}

export interface UpsertPlanTypeInput {
  id: Id | null;
  name: string;
  colorId: Id;
}
