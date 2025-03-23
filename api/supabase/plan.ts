import supabase from '@/composables/supabase';
import { DEMO_DATA } from '@/utils/constants';
import type {
  DeleteInput,
  DeleteOutput,
  SupabaseApiAuth,
  SupabaseApiAuthGet,
  SupabaseApiAuthUpsert,
  UpsertOutput,
} from './common.interface';
import type { GetPlanListInput, GetPlanListOutput, UpsertPlanInput } from './plan.interface';
import { RPC_GET_PLAN_LIST, type GetPlanListRpc } from './rpc/getPlanList.interface';

export const getPlanList = async (
  { isDemoLogin, userUid }: SupabaseApiAuthGet,
  { start, end }: GetPlanListInput
): Promise<GetPlanListOutput> => {
  if (isDemoLogin) return DEMO_DATA.SUPABASE.GET_PLAN_LIST;

  const payload = { input_user_id: userUid, input_start_date: start, input_end_date: end };
  const { data, error } = await supabase.rpc<typeof RPC_GET_PLAN_LIST, GetPlanListRpc>(
    RPC_GET_PLAN_LIST,
    payload
  );
  if (error != null || data === null) {
    return { data: data, error: error, message: 'plan 一覧' };
  }

  return { data: data, error: error, message: 'plan 取得' };
};

export const upsertPlan = async (
  { isDemoLogin, userUid, isPair, pairId }: SupabaseApiAuthUpsert,
  { id, startDate, endDate, planTypeId, name, memo }: UpsertPlanInput
): Promise<UpsertOutput> => {
  if (isDemoLogin) return DEMO_DATA.SUPABASE.COMMON_NO_ERROR;

  if (id === null) {
    if (isPair && pairId == null) {
      return { data: null, error: 'isPair と pairID の関係性', message: 'method 挿入' };
    }

    // 挿入
    const { data, error } = await supabase.from('plans').insert([
      {
        user_id: isPair ? null : userUid,
        pair_id: isPair ? pairId : null,
        start_date: startDate,
        end_date: endDate,
        plan_type_id: planTypeId,
        name: name,
        memo: memo,
      },
    ]);
    return { data: data, error: error, message: 'plan 挿入' };
  } else if (id) {
    // 更新
    const { data, error } = await supabase
      .from('plans')
      .update({
        user_id: isPair ? null : userUid,
        pair_id: isPair ? pairId : null,
        start_date: startDate,
        end_date: endDate,
        plan_type_id: planTypeId,
        name: name,
        memo: memo,
      })
      .eq('id', id);
    return { data: data, error: error, message: 'plan 更新' };
  } else {
    return { data: null, error: '想定外', message: 'plan upsert 想定外の状況' };
  }
};

export const deletePlan = async (
  { isDemoLogin }: SupabaseApiAuth,
  { id }: DeleteInput
): Promise<DeleteOutput> => {
  if (isDemoLogin) return DEMO_DATA.SUPABASE.COMMON_NO_ERROR;

  const { data, error } = await supabase.from('plans').delete().eq('id', id);
  return { data: data, error: error, message: 'plan 削除' };
};
