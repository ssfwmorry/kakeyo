import type { DateRange, Id } from '@/utils/types/common';
import type { PostgrestError } from '@supabase/supabase-js';
import type { Camelized } from 'humps';
import type { GetPlanListRpcRow } from './rpc/getPlanList.interface';

export interface GetPlanListInput extends DateRange {}
export type GetPlanListItem = Camelized<GetPlanListRpcRow>;
export interface GetPlanListOutput {
  data: GetPlanListItem[];
  error: PostgrestError | null;
  message: string;
}

export interface UpsertPlanInput {
  id: Id | null;
  startDate: string;
  endDate: string;
  planTypeId: Id;
  name: string;
  memo: string | null;
}
