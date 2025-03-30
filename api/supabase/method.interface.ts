import type { Id } from '@/utils/types/common';
import type { PostgrestError } from '@supabase/supabase-js';
import type { Camelized } from 'humps';
import type { ApiOutput, InvalidArgumentError } from './common.interface';
import type { GetMethodListRpcRow } from './rpc/getMethodList.interface';

export type GetMethodListItem = Camelized<GetMethodListRpcRow>;
export type GetMethodListOutputData = {
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
export interface GetMethodListOutput
  extends ApiOutput<GetMethodListOutputData, PostgrestError | InvalidArgumentError> {}

export interface UpsertMethodInput {
  id: Id | null;
  name: string;
  isPay: boolean;
  colorId: Id;
}
