import type { PostgrestError } from '@supabase/supabase-js';
import type { Camelized } from 'humps';
import type { GetPlanTypeListRpcRow } from './rpc/getPlanTypeList.interface';

export type GetPlanTypeListItem = Camelized<GetPlanTypeListRpcRow>;

export interface GetPlanTypeListOutput {
  data: {
    self: GetPlanTypeListItem[];
    pair: GetPlanTypeListItem[];
  };
  error: PostgrestError | null;
  message: string;
}

export interface UpsertPlanTypeInput {
  id: number | null;
  name: string;
  colorId: number;
}
