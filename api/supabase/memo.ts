import { camelizeKeys } from 'humps';
import supabase from '~/composables/supabase';
import { DEMO_DATA } from '~/utils/constants';
import {
  buildNoDataApiOutput,
  type DeleteInput,
  type DeleteOutput,
  type SupabaseApiDemo,
  type SupabaseApiDemoAndUserAndPair,
  type SupabaseApiUserAndPair,
} from './common.interface';
import type {
  DbMemo,
  GetMemoListOutput,
  InsertMemoInput,
  InsertMemoOutput,
} from './memo.interface';

export const getMemoList = async ({
  userUid,
  pairId,
}: SupabaseApiUserAndPair): Promise<GetMemoListOutput> => {
  const wherePairId = pairId !== null ? `,pair_id.eq.${pairId}` : '';
  type PickedMemo = Pick<DbMemo, 'id' | 'memo' | 'pair_id'>;
  const { data, error } = await supabase
    .from('memos')
    .select<'id, memo, pair_id', PickedMemo>('id, memo, pair_id')
    .or(`user_id.eq.${userUid}${wherePairId}`);
  if (error !== null || data === null) {
    return { error, message: 'memos 取得' };
  }

  const camelizedData = camelizeKeys<{ data: PickedMemo[] }>({ data });
  return { data: camelizedData.data, error: null, message: 'memos 取得' };
};

export const insertMemo = async (
  { isDemoLogin, userUid, pairId }: SupabaseApiDemoAndUserAndPair,
  { memo, isPair }: InsertMemoInput
): Promise<InsertMemoOutput> => {
  if (isDemoLogin) return DEMO_DATA.SUPABASE.COMMON_NO_ERROR;

  const { error } = await supabase.from('memos').insert([
    {
      user_id: isPair ? null : userUid,
      pair_id: isPair ? pairId : null,
      memo: memo,
    },
  ]);
  return buildNoDataApiOutput(error, 'memo 挿入');
};

export const deleteMemo = async (
  { isDemoLogin }: SupabaseApiDemo,
  { id }: DeleteInput
): Promise<DeleteOutput> => {
  if (isDemoLogin) return DEMO_DATA.SUPABASE.COMMON_NO_ERROR;

  const { error } = await supabase.from('memos').delete().eq('id', id);
  return buildNoDataApiOutput(error, 'memo 削除');
};
