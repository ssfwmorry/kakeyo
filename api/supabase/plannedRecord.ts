import { camelizeKeys } from 'humps';
import supabase from '~/composables/supabase';
import { DEMO_DATA } from '~/utils/constants';
import { RecordType } from '~/utils/types/model';
import type {
  DeleteInput,
  DeleteOutput,
  SupabaseApiAuthUpsert,
  SupabaseApiDemo,
  SupabaseApiUser,
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
  type GetPlannedRecordListRpcRow,
} from './rpc/getPlannedRecordList.interface';
import { RPC_SWAP_PLANNED_RECORD, type SwapRpc } from './rpc/swap.interface';

export const getPlannedRecordList = async ({
  userUid,
}: SupabaseApiUser): Promise<GetPlannedRecordListOutput> => {
  const payload = { input_user_id: userUid };
  const { data, error } = await supabase.rpc<
    typeof RPC_GET_PLANNED_RECORD_LIST,
    GetPlannedRecordListRpc
  >(RPC_GET_PLANNED_RECORD_LIST, payload);
  if (error != null || data === null) {
    return { error: error, message: 'planned_record 一覧' };
  }

  const camelizedData = camelizeKeys<{ data: GetPlannedRecordListRpcRow[] }>({ data });
  return {
    data: {
      self: camelizedData.data.filter((e) => !e.isPair),
      pair: camelizedData.data.filter((e) => e.isPair),
    },
    error: null,
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

  if (isPair && pairId == null) {
    return { error: 'isPair と pairID の関係性', message: 'method 挿入' };
  }

  const recordType =
    isPair === false ? RecordType.self : isInstead ? RecordType.instead : RecordType.pair;

  if (id === null) {
    // 挿入
    const { error } = await supabase.from('planned_records').insert([
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
        record_type: recordType,
      },
    ]);
    return {
      data: error !== null ? undefined : null,
      error: error,
      message: 'planned_record 挿入',
    };
  } else {
    // 更新
    const { error } = await supabase
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
        record_type: recordType,
      })
      .eq('id', id);
    return {
      data: error !== null ? undefined : null,
      error: error,
      message: 'planned_record 更新',
    };
  }
};

export const deletePlannedRecord = async (
  { isDemoLogin }: SupabaseApiDemo,
  { id }: DeleteInput
): Promise<DeleteOutput> => {
  if (isDemoLogin) return DEMO_DATA.SUPABASE.COMMON_NO_ERROR;

  const { error } = await supabase.from('planned_records').delete().eq('id', id);
  return {
    data: error !== null ? undefined : null,
    error: error,
    message: 'planned_record 削除',
  };
};

export const swapPlannedRecord = async (
  { isDemoLogin }: SupabaseApiDemo,
  { prevId, nextId }: SwapInput
): Promise<SwapOutput> => {
  if (isDemoLogin) return DEMO_DATA.SUPABASE.COMMON_NO_ERROR;
  const { error } = await supabase.rpc<typeof RPC_SWAP_PLANNED_RECORD, SwapRpc>(
    RPC_SWAP_PLANNED_RECORD,
    { id1: prevId, id2: nextId }
  );
  return {
    data: error !== null ? undefined : null,
    error: error,
    message: 'planned_record 入替',
  };
};
