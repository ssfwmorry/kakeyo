import supabase from '@/composables/supabase';
import { DEMO_DATA } from '@/utils/constants';
import type { SupabaseApiAuth, SupabaseApiAuthGet, SupabaseApiAuthUpsert } from '@/utils/types/api';

export const getPlanTypeList = async ({ isDemoLogin, userUid }: SupabaseApiAuthGet) => {
  if (isDemoLogin) return DEMO_DATA.SUPABASE.GET_PLAN_TYPE_LIST;

  const payload = { input_user_id: userUid };
  const { data, error } = await supabase.rpc('get_plan_type_list', payload);
  if (error != null) {
    return { data: data, error: error, message: 'plan_type 一覧' };
  }

  return {
    data: {
      self: data.filter((e: any) => !e.is_pair),
      pair: data.filter((e: any) => e.is_pair),
    },
    error: error,
    message: 'plan_type 取得',
  };
};
export const upsertPlanType = async (
  { isDemoLogin, userUid, isPair, pairId }: SupabaseApiAuthUpsert,
  { id, name, colorId }: any
) => {
  if (isDemoLogin) return DEMO_DATA.SUPABASE.COMMON_NO_ERROR;

  if (id === null) {
    // TODO よりよい状況バリデーションチェック
    if (isPair && pairId == null) {
      return { data: null, error: 'isPair と pairID の関係性', message: 'plan_type 挿入' };
    }
    // 挿入
    const { data, error } = await supabase.from('plan_types').insert([
      {
        name: name,
        user_id: isPair ? null : userUid,
        pair_id: isPair ? pairId : null,
        color_classification_id: colorId,
      },
    ]);
    return { data: data, error: error, message: 'plan_type 挿入' };
  } else if (id) {
    // 更新
    const { data, error } = await supabase
      .from('plan_types')
      .update({
        name: name,
        color_classification_id: colorId,
      })
      .eq('id', id);
    return { data: data, error: error, message: 'plan_type 更新' };
  } else {
    return { data: null, error: true, message: 'plan_type upsert 想定外の状況' };
  }
};
export const deletePlanType = async ({ isDemoLogin }: SupabaseApiAuth, { id }: any) => {
  if (isDemoLogin) return DEMO_DATA.SUPABASE.COMMON_NO_ERROR;

  const { data, error } = await supabase.from('plan_types').delete().eq('id', id);
  return { data: data, error: error, message: 'plan_type 削除' };
};
export const swapPlanType = async ({ isDemoLogin }: SupabaseApiAuth, { prevId, nextId }: any) => {
  if (isDemoLogin) return DEMO_DATA.SUPABASE.COMMON_NO_ERROR;

  const { data, error } = await supabase.rpc('swap_plan_type', { id1: prevId, id2: nextId });
  return { data: data, error: error, message: 'plan_type 入替' };
};
