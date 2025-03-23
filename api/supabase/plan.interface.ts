import type { DateRange } from '@/utils/types/common';
import type { PostgrestError } from '@supabase/supabase-js';
import type { GetPlanListRpcResponse } from './rpc/getPlanList.interface';

export interface GetPlanListInput extends DateRange {}
export interface GetPlanListOutput {
  data: GetPlanListRpcResponse;
  error: PostgrestError | null;
  message: string;
}

export interface UpsertPlanInput {
  id: number | null;
  startDate: string;
  endDate: string;
  planTypeId: number;
  name: string;
  memo: string | null;
}
