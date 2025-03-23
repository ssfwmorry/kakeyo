import type { Memo } from '@/utils/types/model';
import type { PostgrestError } from '@supabase/supabase-js';

export interface GetMemoListOutput {
  data: Pick<Memo, 'id' | 'memo' | 'pair_id'>[] | null;
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
