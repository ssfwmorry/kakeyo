import supabase from '@/composables/supabase';
import { DEMO_DATA } from '@/utils/constants';
import type { SupabaseApiAuth } from '@/utils/types/api';
import type {
  DeleteInput,
  DeleteOutput,
  SwapInput,
  SwapOutput,
  UpsertOutput,
} from './common.interface';
import { RPC_SWAP_SUB_TYPE, type SwapRpc } from './rpc/swap.interface';
import type { UpsertSubTypeInput } from './subType.interface';

export const upsertSubType = async (
  { isDemoLogin }: SupabaseApiAuth,
  { id, typeId, name }: UpsertSubTypeInput
): Promise<UpsertOutput> => {
  if (isDemoLogin) return DEMO_DATA.SUPABASE.COMMON_NO_ERROR;

  if (id === null) {
    // 挿入
    const { data, error } = await supabase.from('sub_types').insert([
      {
        type_id: typeId,
        name: name,
      },
    ]);
    return { data: data, error: error, message: 'sub_types 挿入' };
  } else if (id) {
    // 更新
    const { data, error } = await supabase.from('sub_types').update({ name: name }).eq('id', id);
    return { data: data, error: error, message: 'sub_types 更新' };
  } else {
    return { data: null, error: '想定外', message: 'sub_types upsert 想定外の状況' };
  }
};

export const deleteSubType = async (
  { isDemoLogin }: SupabaseApiAuth,
  { id }: DeleteInput
): Promise<DeleteOutput> => {
  if (isDemoLogin) return DEMO_DATA.SUPABASE.COMMON_NO_ERROR;

  const { data, error } = await supabase.from('sub_types').delete().eq('id', id);
  return { data: data, error: error, message: 'sub_type 削除' };
};

export const swapSubType = async (
  { isDemoLogin }: SupabaseApiAuth,
  { prevId, nextId }: SwapInput
): Promise<SwapOutput> => {
  if (isDemoLogin) return DEMO_DATA.SUPABASE.COMMON_NO_ERROR;
  const { data, error } = await supabase.rpc<typeof RPC_SWAP_SUB_TYPE, SwapRpc>(RPC_SWAP_SUB_TYPE, {
    id1: prevId,
    id2: nextId,
  });

  return { data: data, error: error, message: 'sub_type 入替' };
};
