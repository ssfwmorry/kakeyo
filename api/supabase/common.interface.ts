import type { Id } from '@/utils/types/common';
import type { PostgrestError } from '@supabase/supabase-js';

export interface UpsertOutput {
  data: null;
  error: PostgrestError | string | null;
  message: string;
}

export interface DeleteInput {
  id: Id;
}
export interface DeleteOutput {
  data: null;
  error: PostgrestError | null;
  message: string;
}

export interface SwapInput {
  prevId: number;
  nextId: number;
}
export interface SwapOutput {
  data: null;
  error: PostgrestError | null;
  message: string;
}
