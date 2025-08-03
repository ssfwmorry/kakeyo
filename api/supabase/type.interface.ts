import type { PostgrestError } from '@supabase/supabase-js';
import type { Camelized } from 'humps';
import type { Id } from '~/utils/types/common';
import type { ApiOutput } from './common.interface';
import type { GetTypeListRpcRow } from './rpc/getTypeList.interface';

export type GetTypeListItemSubTypeListItem = {
  subTypeId: Id;
  subTypeName: string;
  subTypeSort: number;
};
export type GetTypeListItem = Camelized<
  Omit<GetTypeListRpcRow, 'sub_type_id' | 'sub_type_name' | 'sub_type_sort'> & {
    subTypes: GetTypeListItemSubTypeListItem[];
  }
>;

export type GetTypeListOutputData = {
  // TODO isPayとisPairが確定しているので型を調整する
  income: {
    self: GetTypeListItem[];
    pair: GetTypeListItem[];
  };
  pay: {
    self: GetTypeListItem[];
    pair: GetTypeListItem[];
  };
};
export interface GetTypeListOutput extends ApiOutput<GetTypeListOutputData, PostgrestError> {}

export interface UpsertTypeInput {
  id: Id | null;
  name: string;
  isPay: boolean;
  colorId: Id;
}
