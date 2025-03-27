import type { Memo } from '@/utils/types/model';
import type { PostgrestError } from '@supabase/supabase-js';
import type { Decamelized } from 'humps';

export type DbMemo = Decamelized<Pick<Memo, 'id' | 'memo' | 'pairId'>>;
type GetMemoListItem = Pick<Memo, 'id' | 'memo' | 'pairId'>;
export interface GetMemoListOutput {
  data: GetMemoListItem[];
  error: PostgrestError | null;
  message: string;
}

export interface InsertMemoInput {
  memo: string;
  isPair: boolean;
}
export interface InsertMemoOutput {
  data: null;
  error: PostgrestError | null;
  message: string;
}
