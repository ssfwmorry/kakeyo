import type { ColorClassification } from '@/utils/types/model';
import type { PostgrestError } from '@supabase/supabase-js';
import type { Decamelized } from 'humps';
import type { ApiOutput } from './common.interface';

export type DbColorClassification = Decamelized<ColorClassification>;

export interface GetColorClassificationListOutput
  extends ApiOutput<ColorClassification[], PostgrestError> {}
