import supabase from '@/composables/supabase';
import { DEMO_DATA } from '@/utils/constants';
import {
  buildNoDataApiOutput,
  type DeleteInput,
  type DeleteOutput,
  type SupabaseApiDemo,
  type SwapInput,
  type SwapOutput,
  type UpsertOutput,
} from './common.interface';
import { RPC_SWAP_SUB_TYPE, type SwapRpc } from './rpc/swap.interface';
import type { UpsertSubTypeInput } from './subType.interface';

export const upsertSubType = async (
  { isDemoLogin }: SupabaseApiDemo,
  { id, typeId, name }: UpsertSubTypeInput
): Promise<UpsertOutput> => {
  if (isDemoLogin) return DEMO_DATA.SUPABASE.COMMON_NO_ERROR;

  if (id === null) {
    // 挿入
    const { error } = await supabase.from('sub_types').insert([{ type_id: typeId, name: name }]);
    return buildNoDataApiOutput(error, 'sub_type 挿入');
  } else {
    // 更新
    const { error } = await supabase.from('sub_types').update({ name: name }).eq('id', id);
    return buildNoDataApiOutput(error, 'sub_type 更新');
  }
};

export const deleteSubType = async (
  { isDemoLogin }: SupabaseApiDemo,
  { id }: DeleteInput
): Promise<DeleteOutput> => {
  if (isDemoLogin) return DEMO_DATA.SUPABASE.COMMON_NO_ERROR;

  const { error } = await supabase.from('sub_types').delete().eq('id', id);
  return buildNoDataApiOutput(error, 'sub_type 削除');
};

export const swapSubType = async (
  { isDemoLogin }: SupabaseApiDemo,
  { prevId, nextId }: SwapInput
): Promise<SwapOutput> => {
  if (isDemoLogin) return DEMO_DATA.SUPABASE.COMMON_NO_ERROR;

  const { error } = await supabase.rpc<typeof RPC_SWAP_SUB_TYPE, SwapRpc>(RPC_SWAP_SUB_TYPE, {
    id1: prevId,
    id2: nextId,
  });
  return buildNoDataApiOutput(error, 'sub_type 入替');
};
