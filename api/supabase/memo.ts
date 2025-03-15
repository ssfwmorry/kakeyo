import supabase from '@/composables/supabase';
import { DEMO_DATA } from '@/utils/constants';
import type { SupabaseApiAuth, SupabaseApiAuthGet, SupabaseApiAuthUpsert } from '@/utils/types/api';

export const getMemoList = async ({
  isDemoLogin,
  userUid,
  pairId,
}: SupabaseApiAuthGet & { pairId: number }) => {
  if (isDemoLogin) return DEMO_DATA.SUPABASE.GET_MEMO_LIST;

  const wherePairId = pairId ? `,pair_id.eq.${pairId}` : '';
  const { data, error } = await supabase
    .from('memos')
    .select('id, memo, pair_id')
    .or(`user_id.eq.${userUid}${wherePairId}`);
  return { data: data, error: error, message: 'memos 取得' };
};
export const insertMemo = async (
  { isDemoLogin, userUid, isPair, pairId }: SupabaseApiAuthUpsert,
  { memo, isPair: isPairMemo }: any
) => {
  if (isDemoLogin) return DEMO_DATA.SUPABASE.COMMON_NO_ERROR;

  const { data, error } = await supabase.from('memos').insert([
    {
      user_id: isPairMemo ? null : userUid,
      pair_id: isPairMemo ? pairId : null,
      memo: memo,
    },
  ]);
  return { data: data, error: error, message: 'memo 挿入' };
};
export const deleteMemo = async ({ isDemoLogin }: SupabaseApiAuth, { id }: any) => {
  if (isDemoLogin) return DEMO_DATA.SUPABASE.COMMON_NO_ERROR;

  const { data, error } = await supabase.from('memos').delete().eq('id', id);
  return { data: data, error: error, message: 'memo 削除' };
};
