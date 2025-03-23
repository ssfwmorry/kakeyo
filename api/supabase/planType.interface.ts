import type { PostgrestError } from '@supabase/supabase-js';
import type { GetPlanTypeListRpcRow } from './rpc/getPlanTypeList.interface';

export interface GetPlanTypeListOutput {
  data: {
    self: GetPlanTypeListRpcRow[];
    pair: GetPlanTypeListRpcRow[];
  } | null;
  error: PostgrestError | null;
  message: string;
}

export interface UpsertPlanTypeInput {
  id: number | null;
  name: string;
  colorId: number;
}
