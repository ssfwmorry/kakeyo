import supabase from '@/composables/supabase';
import { DEMO_DATA } from '@/utils/constants';
import { camelizeKeys } from 'humps';
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
import {
  RPC_GET_TYPE_LIST,
  type GetTypeListRpc,
  type GetTypeListRpcRow,
} from './rpc/getTypeList.interface';
import { RPC_SWAP_TYPE, type SwapRpc } from './rpc/swap.interface';
import type { GetTypeListItem, GetTypeListOutput, UpsertTypeInput } from './type.interface';

export const getGroupedTypeList = (data: GetTypeListRpcRow[]) => {
  let groupedData: GetTypeListItem[] = [];
  data.forEach((row, i: number) => {
    if (i == 0 || groupedData[groupedData.length - 1].typeId != row.type_id) {
      groupedData.push({ ...camelizeKeys<GetTypeListRpcRow>(row), subTypes: [] });
    }
    if (row.sub_type_id !== null && row.sub_type_name !== null && row.sub_type_sort !== null) {
      groupedData[groupedData.length - 1].subTypes.push({
        subTypeId: row.sub_type_id,
        subTypeName: row.sub_type_name,
        subTypeSort: row.sub_type_sort,
      });
    }
  });
  return groupedData;
};

export const getTypeList = async ({ userUid }: SupabaseApiUser): Promise<GetTypeListOutput> => {
  const payload = { input_user_id: userUid };
  const { data, error } = await supabase.rpc<typeof RPC_GET_TYPE_LIST, GetTypeListRpc>(
    RPC_GET_TYPE_LIST,
    payload
  );
  if (error != null || data === null) {
    return { error: error, message: 'type 一覧' };
  }

  const incomeSelf = data.filter((e) => !e.is_pair && !e.is_pay);
  const incomePair = data.filter((e) => e.is_pair && !e.is_pay);
  const paySelf = data.filter((e) => !e.is_pair && e.is_pay);
  const payPair = data.filter((e) => e.is_pair && e.is_pay);

  return {
    data: {
      income: {
        self: getGroupedTypeList(incomeSelf),
        pair: getGroupedTypeList(incomePair),
      },
      pay: {
        self: getGroupedTypeList(paySelf),
        pair: getGroupedTypeList(payPair),
      },
    },
    error: null,
    message: 'type 取得',
  };
};

export const upsertType = async (
  { isDemoLogin, userUid, isPair, pairId }: SupabaseApiAuthUpsert,
  { id, name, isPay, colorId }: UpsertTypeInput
): Promise<UpsertOutput> => {
  if (isDemoLogin) return DEMO_DATA.SUPABASE.COMMON_NO_ERROR;

  if (isPair && pairId == null) {
    return { data: null, error: 'isPair と pairID の関係性', message: 'type upsertType' };
  }

  if (id === null) {
    // 挿入
    const { error } = await supabase.from('types').insert([
      {
        name: name,
        user_id: isPair ? null : userUid,
        pair_id: isPair ? pairId : null,
        is_pay: isPay,
        color_classification_id: colorId,
      },
    ]);
    return buildNoDataApiOutput(error, 'type 挿入');
  } else {
    // 更新
    const { error } = await supabase
      .from('types')
      .update({
        name: name,
        color_classification_id: colorId,
      })
      .eq('id', id);
    return buildNoDataApiOutput(error, 'type 更新');
  }
};

export const deleteType = async (
  { isDemoLogin }: SupabaseApiDemo,
  { id }: DeleteInput
): Promise<DeleteOutput> => {
  if (isDemoLogin) return DEMO_DATA.SUPABASE.COMMON_NO_ERROR;

  const { error } = await supabase.from('types').delete().eq('id', id);
  return buildNoDataApiOutput(error, 'type 削除');
};

export const swapType = async (
  { isDemoLogin }: SupabaseApiDemo,
  { prevId, nextId }: SwapInput
): Promise<SwapOutput> => {
  if (isDemoLogin) return DEMO_DATA.SUPABASE.COMMON_NO_ERROR;

  const { error } = await supabase.rpc<typeof RPC_SWAP_TYPE, SwapRpc>(RPC_SWAP_TYPE, {
    id1: prevId,
    id2: nextId,
  });
  return buildNoDataApiOutput(error, 'type 入替');
};
