import type { DayClassification } from '@/utils/types/model';
import type { PostgrestError } from '@supabase/supabase-js';
import type { Decamelized } from 'humps';
import type { ApiOutput } from './common.interface';

export type DbDayClassification = Decamelized<DayClassification>;

export interface GetDayClassificationListOutput
  extends ApiOutput<DayClassification[], PostgrestError> {}
