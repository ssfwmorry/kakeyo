import type { Id } from '@/utils/types/common';
import type { PostgrestError } from '@supabase/supabase-js';
import type { Camelized } from 'humps';
import type { GetMethodListRpcRow } from './rpc/getMethodList.interface';

export type GetMethodListItem = Camelized<GetMethodListRpcRow>;
export interface GetMethodListOutput {
  data: {
    // TODO: is_payとis_pairが確定するので型に反映させる
    income: {
      self: GetMethodListItem[];
      pair: GetMethodListItem[];
    };
    pay: {
      self: GetMethodListItem[];
      pair: GetMethodListItem[];
    };
  };
  error: PostgrestError | null;
  message: string;
}

export interface UpsertMethodInput {
  id: Id | null;
  name: string;
  isPay: boolean;
  colorId: Id;
}
