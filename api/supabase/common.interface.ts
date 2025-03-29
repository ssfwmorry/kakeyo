import type { Id } from '@/utils/types/common';
import type { PostgrestError } from '@supabase/supabase-js';

export type SupabaseApiAuth = {
  isDemoLogin: boolean;
};
export type SupabaseApiAuthGet = {
  userUid: string;
} & SupabaseApiAuth;
export type SupabaseApiAuthUpsert = {
  isPair: boolean;
  pairId: Id | null;
} & SupabaseApiAuthGet;

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
  prevId: Id;
  nextId: Id;
}
export interface SwapOutput {
  data: null;
  error: PostgrestError | null;
  message: string;
}
