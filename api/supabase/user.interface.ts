import type { Id } from '@/utils/types/common';
import type { PostgrestError } from '@supabase/supabase-js';

export interface GetPairIdInput {
  uid: string;
}
export interface GetPairIdOutput {
  data: Id | null;
  error: PostgrestError | string | null;
  message: string;
}
