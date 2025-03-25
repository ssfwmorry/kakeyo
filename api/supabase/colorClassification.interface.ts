import type { ColorClassification } from '@/utils/types/model';
import type { PostgrestError } from '@supabase/supabase-js';

export interface GetColorClassificationListOutput {
  data: ColorClassification[];
  error: PostgrestError | null;
  message: string;
}
