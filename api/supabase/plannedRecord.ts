import supabase from '@/composables/supabase';
import { DEMO_DATA } from '@/utils/constants';
import type { SupabaseApiAuth, SupabaseApiAuthGet, SupabaseApiAuthUpsert } from '@/utils/types/api';
import type {
  DeleteInput,
  DeleteOutput,
  SwapInput,
  SwapOutput,
  UpsertOutput,
} from './common.interface';
import type {
  GetPlannedRecordListOutput,
  UpsertPlannedRecordInput,
} from './plannedRecord.interface';
import {
  RPC_GET_PLANNED_RECORD_LIST,
  type GetPlannedRecordListRpc,
} from './rpc/getPlannedRecordList.interface';
import { RPC_SWAP_PLANNED_RECORD, type SwapRpc } from './rpc/swap.interface';

export const getPlannedRecordList = async ({
  isDemoLogin,
  userUid,
}: SupabaseApiAuthGet): Promise<GetPlannedRecordListOutput> => {
  if (isDemoLogin) return DEMO_DATA.SUPABASE.GET_PLANNED_RECORD_LIST;

  const payload = { input_user_id: userUid };
  const { data, error } = await supabase.rpc<
    typeof RPC_GET_PLANNED_RECORD_LIST,
    GetPlannedRecordListRpc
  >(RPC_GET_PLANNED_RECORD_LIST, payload);
  if (error != null || data === null) {
    return { data: { self: [], pair: [] }, error: error, message: 'planned_record 一覧' };
  }

  return {
    data: {
      self: data.filter((e: any) => !e.is_pair),
      pair: data.filter((e: any) => e.is_pair),
    },
    error: error,
    message: 'planned_record 一覧',
  };
};

export const upsertPlannedRecord = async (
  { isDemoLogin, userUid, isPair, pairId }: SupabaseApiAuthUpsert,
  {
    id,
    dayClassificationId,
    isPay,
    methodId,
    isInstead,
    typeId,
    subTypeId,
    price,
    memo,
  }: UpsertPlannedRecordInput
): Promise<UpsertOutput> => {
  if (isDemoLogin) return DEMO_DATA.SUPABASE.COMMON_NO_ERROR;

  if (id === null) {
    if (isPair && pairId == null) {
      return { data: null, error: 'isPair と pairID の関係性', message: 'method 挿入' };
    }

    // 挿入
    const { data, error } = await supabase.from('planned_records').insert([
      {
        user_id: isPair && !isInstead ? null : userUid,
        pair_id: isPair ? pairId : null,
        day_classification_id: dayClassificationId,
        is_pay: isPay,
        method_id: methodId,
        type_id: typeId,
        sub_type_id: subTypeId,
        price: price,
        memo: memo,
      },
    ]);
    return { data: data, error: error, message: 'planned_record 挿入' };
  } else if (id) {
    // 更新
    const { data, error } = await supabase
      .from('planned_records')
      .update({
        user_id: isPair && !isInstead ? null : userUid,
        pair_id: isPair ? pairId : null,
        day_classification_id: dayClassificationId,
        is_pay: isPay,
        method_id: methodId,
        type_id: typeId,
        sub_type_id: subTypeId,
        price: price,
        memo: memo,
      })
      .eq('id', id);
    return { data: data, error: error, message: 'planned_record 更新' };
  } else {
    return { data: null, error: '想定外', message: 'planned_record upsert 想定外の状況' };
  }
};

export const deletePlannedRecord = async (
  { isDemoLogin }: SupabaseApiAuth,
  { id }: DeleteInput
): Promise<DeleteOutput> => {
  if (isDemoLogin) return DEMO_DATA.SUPABASE.COMMON_NO_ERROR;

  const { data, error } = await supabase.from('planned_records').delete().eq('id', id);
  return { data: data, error: error, message: 'planned_record 削除' };
};

export const swapPlannedRecord = async (
  { isDemoLogin }: SupabaseApiAuth,
  { prevId, nextId }: SwapInput
): Promise<SwapOutput> => {
  if (isDemoLogin) return DEMO_DATA.SUPABASE.COMMON_NO_ERROR;
  const { data, error } = await supabase.rpc<typeof RPC_SWAP_PLANNED_RECORD, SwapRpc>(
    RPC_SWAP_PLANNED_RECORD,
    { id1: prevId, id2: nextId }
  );

  return { data: data, error: error, message: 'planned_record 入替' };
};
