import supabase from '@/composables/supabase';
import { DEMO_DATA } from '@/utils/constants';
import type { Id } from '@/utils/types/common';
import { camelizeKeys } from 'humps';
import type {
  DeleteInput,
  DeleteOutput,
  SupabaseApiAuth,
  SupabaseApiAuthGet,
} from './common.interface';
import type {
  DbMemo,
  GetMemoListOutput,
  InsertMemoInput,
  InsertMemoOutput,
} from './memo.interface';

export const getMemoList = async ({
  isDemoLogin,
  userUid,
  pairId,
}: SupabaseApiAuthGet & { pairId: Id | null }): Promise<GetMemoListOutput> => {
  if (isDemoLogin) return DEMO_DATA.SUPABASE.GET_MEMO_LIST;

  const wherePairId = pairId !== null ? `,pair_id.eq.${pairId}` : '';
  const { data, error } = await supabase
    .from('memos')
    .select('id, memo, pair_id')
    .or(`user_id.eq.${userUid}${wherePairId}`);
  if (error !== null || data === null) {
    return { data: [], error: error, message: 'memos 取得' };
  }

  const camelizedData = camelizeKeys<{ data: DbMemo[] }>({ data });
  return { data: camelizedData.data, error: error, message: 'memos 取得' };
};

export const insertMemo = async (
  { isDemoLogin, userUid, pairId }: SupabaseApiAuthGet & { pairId: Id | null },
  { memo, isPair }: InsertMemoInput
): Promise<InsertMemoOutput> => {
  if (isDemoLogin) return DEMO_DATA.SUPABASE.COMMON_NO_ERROR;

  const { data, error } = await supabase.from('memos').insert([
    {
      user_id: isPair ? null : userUid,
      pair_id: isPair ? pairId : null,
      memo: memo,
    },
  ]);
  return { data: data, error: error, message: 'memo 挿入' };
};

export const deleteMemo = async (
  { isDemoLogin }: SupabaseApiAuth,
  { id }: DeleteInput
): Promise<DeleteOutput> => {
  if (isDemoLogin) return DEMO_DATA.SUPABASE.COMMON_NO_ERROR;

  const { data, error } = await supabase.from('memos').delete().eq('id', id);
  return { data: data, error: error, message: 'memo 削除' };
};
