import type { PostgrestError } from '@supabase/supabase-js';
import type { Decamelized } from 'humps';
import type { Memo } from '~/utils/types/model';
import type { ApiOutput } from './common.interface';

export type DbMemo = Decamelized<Memo>; // Pick<Memo, 'id' | 'memo' | 'pairId'>>;
type GetMemoListItem = Pick<Memo, 'id' | 'memo' | 'pairId'>;
export interface GetMemoListOutput extends ApiOutput<GetMemoListItem[], PostgrestError> {}

export interface InsertMemoInput {
  memo: string;
  isPair: boolean;
}
export interface InsertMemoOutput extends ApiOutput<null, PostgrestError> {}
