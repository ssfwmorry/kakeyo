import type { PostgrestError } from '@supabase/supabase-js';
import type { ColorString, Id } from '~/utils/types/common';
import type { Bank } from '~/utils/types/model';
import type { ApiOutput } from './common.interface';

export type GetBankListItem = Bank & {
  colorClassifications: {
    id: Id;
    name: ColorString;
  };
};
export interface GetBankListOutput extends ApiOutput<GetBankListItem[], PostgrestError> {}

export interface UpsertBankInput {
  id: Id | null;
  name: string;
  colorId: Id;
}
export interface UpsertBankOutput extends ApiOutput<null, PostgrestError> {}
