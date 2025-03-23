import type { PostgrestError } from '@supabase/supabase-js';
import type { GetMethodListRpcRow } from './rpc/getMethodList.interface';

export interface GetMethodListOutput {
  data: {
    // TODO: is_payとis_pairが確定するので型に反映させる
    income: {
      self: GetMethodListRpcRow[];
      pair: GetMethodListRpcRow[];
    };
    pay: {
      self: GetMethodListRpcRow[];
      pair: GetMethodListRpcRow[];
    };
  } | null;
  error: PostgrestError | null;
  message: string;
}

export interface UpsertMethodInput {
  id: number | null;
  name: string;
  isPay: boolean;
  colorId: number;
}
