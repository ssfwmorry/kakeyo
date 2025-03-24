import type { Id } from '@/utils/types/common';
import type { PostgrestError } from '@supabase/supabase-js';
import type { Camelized } from 'humps';
import type { GetTypeListRpcRow } from './rpc/getTypeList.interface';

export type GetTypeListItemSubTypeListItem = {
  subTypeId: number;
  subTypeName: string;
  subTypeSort: number;
};
export type GetTypeListItem = Camelized<
  Omit<GetTypeListRpcRow, 'sub_type_id' | 'sub_type_name' | 'sub_type_sort'> & {
    subTypes: GetTypeListItemSubTypeListItem[];
  }
>;

export interface GetTypeListOutput {
  // TODO isPayとisPairが確定しているので型を調整する
  data: {
    income: {
      self: GetTypeListItem[];
      pair: GetTypeListItem[];
    };
    pay: {
      self: GetTypeListItem[];
      pair: GetTypeListItem[];
    };
  };
  error: PostgrestError | null;
  message: string;
}

export interface UpsertTypeInput {
  id: Id | null;
  name: string;
  isPay: boolean;
  colorId: Id;
}
