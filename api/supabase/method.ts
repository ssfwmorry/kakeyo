import supabase from '@/composables/supabase';
import { DEMO_DATA } from '@/utils/constants';
import { camelizeKeys } from 'humps';
import type {
  DeleteInput,
  DeleteOutput,
  SupabaseApiAuth,
  SupabaseApiAuthGet,
  SupabaseApiAuthUpsert,
  SwapInput,
  SwapOutput,
  UpsertOutput,
} from './common.interface';
import type { GetMethodListOutput, UpsertMethodInput } from './method.interface';
import {
  RPC_GET_METHOD_LIST,
  type GetMethodListRpc,
  type GetMethodListRpcRow,
} from './rpc/getMethodList.interface';
import { RPC_SWAP_METHOD, type SwapRpc } from './rpc/swap.interface';

export const getMethodList = async ({
  isDemoLogin,
  userUid,
}: SupabaseApiAuthGet): Promise<GetMethodListOutput> => {
  if (isDemoLogin) return DEMO_DATA.SUPABASE.GET_METHOD_LIST;

  const payload = { input_user_id: userUid };
  const { data, error } = await supabase.rpc<typeof RPC_GET_METHOD_LIST, GetMethodListRpc>(
    RPC_GET_METHOD_LIST,
    payload
  );
  if (error != null || data === null) {
    return { error: error, message: 'method 一覧' };
  }

  const camelizedData = camelizeKeys<{ data: GetMethodListRpcRow[] }>({ data });
  return {
    data: {
      income: {
        self: camelizedData.data.filter((e) => !e.isPair && !e.isPay),
        pair: camelizedData.data.filter((e) => e.isPair && !e.isPay),
      },
      pay: {
        self: camelizedData.data.filter((e) => !e.isPair && e.isPay),
        pair: camelizedData.data.filter((e) => e.isPair && e.isPay),
      },
    },
    error: null,
    message: 'method 一覧',
  };
};

export const upsertMethod = async (
  { isDemoLogin, userUid, isPair, pairId }: SupabaseApiAuthUpsert,
  { id, name, isPay, colorId }: UpsertMethodInput
): Promise<UpsertOutput> => {
  if (isDemoLogin) return DEMO_DATA.SUPABASE.COMMON_NO_ERROR;

  if (isPair && pairId == null) {
    return { error: 'isPair と pairID の関係性', message: 'method upsert' };
  }

  if (id === null) {
    // 挿入
    const { error } = await supabase.from('methods').insert([
      {
        name: name,
        user_id: isPair ? null : userUid,
        pair_id: isPair ? pairId : null,
        is_pay: isPay,
        color_classification_id: colorId,
      },
    ]);
    return { data: error !== null ? undefined : null, error: error, message: 'method 挿入' };
  } else {
    // 更新
    const { error } = await supabase
      .from('methods')
      .update({
        name: name,
        color_classification_id: colorId,
      })
      .eq('id', id);
    return { data: error !== null ? undefined : null, error: error, message: 'method 更新' };
  }
};

export const deleteMethod = async (
  { isDemoLogin }: SupabaseApiAuth,
  { id }: DeleteInput
): Promise<DeleteOutput> => {
  if (isDemoLogin) return DEMO_DATA.SUPABASE.COMMON_NO_ERROR;

  const { error } = await supabase.from('methods').delete().eq('id', id);
  return { data: error !== null ? undefined : null, error: error, message: 'method 削除' };
};

export const swapMethod = async (
  { isDemoLogin }: SupabaseApiAuth,
  { prevId, nextId }: SwapInput
): Promise<SwapOutput> => {
  if (isDemoLogin) return DEMO_DATA.SUPABASE.COMMON_NO_ERROR;
  const { error } = await supabase.rpc<typeof RPC_SWAP_METHOD, SwapRpc>(RPC_SWAP_METHOD, {
    id1: prevId,
    id2: nextId,
  });
  return { data: error !== null ? undefined : null, error: error, message: 'method 入替' };
};
