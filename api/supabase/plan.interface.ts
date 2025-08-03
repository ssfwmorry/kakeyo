import type { PostgrestError } from '@supabase/supabase-js';
import type { Camelized } from 'humps';
import type { DateRange, Id } from '~/utils/types/common';
import type { ApiOutput } from './common.interface';
import type { GetPlanListRpcRow } from './rpc/getPlanList.interface';

export interface GetPlanListInput extends DateRange {}
export type GetPlanListItem = Camelized<GetPlanListRpcRow>;
export interface GetPlanListOutput extends ApiOutput<GetPlanListItem[], PostgrestError> {}

export interface UpsertPlanInput {
  id: Id | null;
  startDate: string;
  endDate: string;
  planTypeId: Id;
  name: string;
  memo: string | null;
}
