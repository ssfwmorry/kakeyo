import type { Id } from '@/utils/types/common';
import type { Pair } from '@/utils/types/model';
import type { PostgrestError } from '@supabase/supabase-js';
import type { Decamelized } from 'humps';
import type { ApiOutput, DatabaseError } from './common.interface';

export interface GetPairIdInput {
  uid: string;
}
export type DbPair = Decamelized<Pair>;
export interface GetPairIdOutput extends ApiOutput<Id | null, PostgrestError | DatabaseError> {}
