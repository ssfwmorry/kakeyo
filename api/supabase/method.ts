import supabase from '@/composables/supabase';
import { DEMO_DATA } from '@/utils/constants';
import type { SupabaseApiAuth, SupabaseApiAuthGet, SupabaseApiAuthUpsert } from '@/utils/types/api';

export const getMethodList = async ({ isDemoLogin, userUid }: SupabaseApiAuthGet) => {
  if (isDemoLogin) return DEMO_DATA.SUPABASE.GET_METHOD_LIST;

  const payload = { input_user_id: userUid };
  const { data, error } = await supabase.rpc('get_method_list', payload);
  if (error != null) {
    return { data: data, error: error, message: 'method 一覧' };
  }

  return {
    data: {
      income: {
        self: data.filter((e: any) => !e.is_pair && !e.is_pay),
        pair: data.filter((e: any) => e.is_pair && !e.is_pay),
      },
      pay: {
        self: data.filter((e: any) => !e.is_pair && e.is_pay),
        pair: data.filter((e: any) => e.is_pair && e.is_pay),
      },
    },
    error: error,
    message: 'method 一覧',
  };
};
export const upsertMethod = async (
  { isDemoLogin, userUid, isPair, pairId }: SupabaseApiAuthUpsert,
  { id, name, isPay, colorId }: any
) => {
  if (isDemoLogin) return DEMO_DATA.SUPABASE.COMMON_NO_ERROR;

  if (id === null) {
    if (isPair && pairId == null) {
      return { data: null, error: 'isPair と pairID の関係性', message: 'method 挿入' };
    }

    // 挿入
    const { data, error } = await supabase.from('methods').insert([
      {
        name: name,
        user_id: isPair ? null : userUid,
        pair_id: isPair ? pairId : null,
        is_pay: isPay,
        color_classification_id: colorId,
      },
    ]);
    return { data: data, error: error, message: 'method 挿入' };
  } else if (id) {
    // 更新
    const { data, error } = await supabase
      .from('methods')
      .update({
        name: name,
        color_classification_id: colorId,
      })
      .eq('id', id);
    return { data: data, error: error, message: 'method 更新' };
  } else {
    return { data: null, error: true, message: 'method upsert 想定外の状況' };
  }
};
export const deleteMethod = async ({ isDemoLogin }: SupabaseApiAuth, { id }: any) => {
  if (isDemoLogin) return DEMO_DATA.SUPABASE.COMMON_NO_ERROR;

  const { data, error } = await supabase.from('methods').delete().eq('id', id);
  return { data: data, error: error, message: 'method 削除' };
};
export const swapMethod = async ({ isDemoLogin }: SupabaseApiAuth, { prevId, nextId }: any) => {
  if (isDemoLogin) return DEMO_DATA.SUPABASE.COMMON_NO_ERROR;

  const { data, error } = await supabase.rpc('swap_method', { id1: prevId, id2: nextId });
  return { data: data, error: error, message: 'type 入替' };
};
