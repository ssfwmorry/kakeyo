import type { Id } from '@/utils/types/common';
import type { PostgrestError } from '@supabase/supabase-js';
import type { GetTypeListRpcRow } from './rpc/getTypeList.interface';

export type GetTypeListRow = Omit<
  GetTypeListRpcRow,
  'sub_type_id' | 'sub_type_name' | 'sub_type_sort'
> & {
  sub_types: { sub_type_id: number; sub_type_name: string; sub_type_sort: number }[];
};
export interface GetTypeListOutput {
  // TODO isPayとisPairが確定しているので型を調整する
  data: {
    income: {
      self: GetTypeListRow[];
      pair: GetTypeListRow[];
    };
    pay: {
      self: GetTypeListRow[];
      pair: GetTypeListRow[];
    };
  } | null;
  error: PostgrestError | null;
  message: string;
}

export interface UpsertTypeInput {
  id: Id | null;
  name: string;
  isPay: boolean;
  colorId: Id;
}
