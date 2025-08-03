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
  type SwapInput,
  type SwapOutput,
  type UpsertOutput,
} from './common.interface';
import type { GetPlanTypeListOutput, UpsertPlanTypeInput } from './planType.interface';
import {
  RPC_GET_PLAN_TYPE_LIST,
  type GetPlanTypeListRpc,
  type GetPlanTypeListRpcRow,
} from './rpc/getPlanTypeList.interface';
import { RPC_SWAP_PLAN_TYPE, type SwapRpc } from './rpc/swap.interface';

export const getPlanTypeList = async ({
  userUid,
}: SupabaseApiUser): Promise<GetPlanTypeListOutput> => {
  const payload = { input_user_id: userUid };
  const { data, error } = await supabase.rpc<typeof RPC_GET_PLAN_TYPE_LIST, GetPlanTypeListRpc>(
    RPC_GET_PLAN_TYPE_LIST,
    payload
  );
  if (error != null || data === null) {
    return { error: error, message: 'plan_type 一覧' };
  }

  const camelizedData = camelizeKeys<{ data: GetPlanTypeListRpcRow[] }>({ data });
  return {
    data: {
      self: camelizedData.data.filter((e) => !e.isPair),
      pair: camelizedData.data.filter((e) => e.isPair),
    },
    error: null,
    message: 'plan_type 取得',
  };
};

export const upsertPlanType = async (
  { isDemoLogin, userUid, isPair, pairId }: SupabaseApiAuthUpsert,
  { id, name, colorId }: UpsertPlanTypeInput
): Promise<UpsertOutput> => {
  if (isDemoLogin) return DEMO_DATA.SUPABASE.COMMON_NO_ERROR;

  if (isPair && pairId == null) {
    return { data: null, error: 'isPair と pairID の関係性', message: 'plan_type 挿入' };
  }

  if (id === null) {
    // 挿入
    const { error } = await supabase.from('plan_types').insert([
      {
        name: name,
        user_id: isPair ? null : userUid,
        pair_id: isPair ? pairId : null,
        color_classification_id: colorId,
      },
    ]);
    return buildNoDataApiOutput(error, 'plan_type 挿入');
  } else {
    // 更新
    const { error } = await supabase
      .from('plan_types')
      .update({
        name: name,
        color_classification_id: colorId,
      })
      .eq('id', id);
    return buildNoDataApiOutput(error, 'plan_type 更新');
  }
};

export const deletePlanType = async (
  { isDemoLogin }: SupabaseApiDemo,
  { id }: DeleteInput
): Promise<DeleteOutput> => {
  if (isDemoLogin) return DEMO_DATA.SUPABASE.COMMON_NO_ERROR;

  const { error } = await supabase.from('plan_types').delete().eq('id', id);
  return buildNoDataApiOutput(error, 'plan_type 削除');
};

export const swapPlanType = async (
  { isDemoLogin }: SupabaseApiDemo,
  { prevId, nextId }: SwapInput
): Promise<SwapOutput> => {
  if (isDemoLogin) return DEMO_DATA.SUPABASE.COMMON_NO_ERROR;
  const { error } = await supabase.rpc<typeof RPC_SWAP_PLAN_TYPE, SwapRpc>(RPC_SWAP_PLAN_TYPE, {
    id1: prevId,
    id2: nextId,
  });
  return buildNoDataApiOutput(error, 'plan_type 入替');
};
