import { camelizeKeys } from 'humps';
import supabase from '~/composables/supabase';
import { DEMO_DATA } from '~/utils/constants';
import {
  buildNoDataApiOutput,
  type DeleteInput,
  type DeleteOutput,
  type SupabaseApiAuthUpsert,
  type SupabaseApiDemo,
  type SupabaseApiUser,
  type UpsertOutput,
} from './common.interface';
import type { GetPlanListInput, GetPlanListOutput, UpsertPlanInput } from './plan.interface';
import {
  RPC_GET_PLAN_LIST,
  type GetPlanListRpc,
  type GetPlanListRpcRow,
} from './rpc/getPlanList.interface';

export const getPlanList = async (
  { userUid }: SupabaseApiUser,
  { start, end }: GetPlanListInput
): Promise<GetPlanListOutput> => {
  const payload = { input_user_id: userUid, input_start_date: start, input_end_date: end };
  const { data, error } = await supabase.rpc<typeof RPC_GET_PLAN_LIST, GetPlanListRpc>(
    RPC_GET_PLAN_LIST,
    payload
  );
  if (error != null || data === null) {
    return { error: error, message: 'plan 一覧' };
  }

  const camelizedData = camelizeKeys<{ data: GetPlanListRpcRow[] }>({ data });
  return { data: camelizedData.data, error: error, message: 'plan 取得' };
};

export const upsertPlan = async (
  { isDemoLogin, userUid, isPair, pairId }: SupabaseApiAuthUpsert,
  { id, startDate, endDate, planTypeId, name, memo }: UpsertPlanInput
): Promise<UpsertOutput> => {
  if (isDemoLogin) return DEMO_DATA.SUPABASE.COMMON_NO_ERROR;

  if (isPair && pairId == null) {
    return { error: 'isPair と pairID の関係性', message: 'method 挿入' };
  }

  if (id === null) {
    // 挿入
    const { error } = await supabase.from('plans').insert([
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
    return buildNoDataApiOutput(error, 'plan 挿入');
  } else {
    // 更新
    const { error } = await supabase
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
    return buildNoDataApiOutput(error, 'plan 更新');
  }
};

export const deletePlan = async (
  { isDemoLogin }: SupabaseApiDemo,
  { id }: DeleteInput
): Promise<DeleteOutput> => {
  if (isDemoLogin) return DEMO_DATA.SUPABASE.COMMON_NO_ERROR;

  const { error } = await supabase.from('plans').delete().eq('id', id);
  return buildNoDataApiOutput(error, 'plan 削除');
};
