import type { Id } from '@/utils/types/common';
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
  id: Id | null;
  name: string;
  colorId: Id;
}
