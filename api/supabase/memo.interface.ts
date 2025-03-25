import type { Memo } from '@/utils/types/model';
import type { PostgrestError } from '@supabase/supabase-js';
import type { Camelized } from 'humps';

type GetMemoListItem = Camelized<Pick<Memo, 'id' | 'memo' | 'pair_id'>>;
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
