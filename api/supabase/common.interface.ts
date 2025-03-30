import type { Id } from '@/utils/types/common';
import type { PostgrestError } from '@supabase/supabase-js';

export const PostgrestErrorCode = { FOREIGN_KEY: '23503' } as const;

export type InvalidArgumentError = string;
export type DatabaseError = string;
export type ApiOutput<S, T> = { data?: S; error: T | null; message: string };

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

export interface UpsertOutput extends ApiOutput<null, PostgrestError | InvalidArgumentError> {}

export interface DeleteInput {
  id: Id;
}
export interface DeleteOutput extends ApiOutput<null, PostgrestError> {}

export interface SwapInput {
  prevId: Id;
  nextId: Id;
}
export interface SwapOutput extends ApiOutput<null, PostgrestError> {}

export function buildNoDataApiOutput<T>(error: T | null, message: string) {
  return { data: error !== null ? undefined : null, error: error, message };
}
