import type { DayClassification } from '@/utils/types/model';
import type { PostgrestError } from '@supabase/supabase-js';

export interface GetDayClassificationListOutput {
  data: DayClassification[] | null;
  error: PostgrestError | null;
  message: string;
}
