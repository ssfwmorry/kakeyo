import supabase from '@/composables/supabase';
import { DEMO_DATA } from '@/utils/constants';
import type { SupabaseApiAuth } from '@/utils/types/api';

export const upsertSubType = async (
  { isDemoLogin }: SupabaseApiAuth,
  { id, typeId, name }: any
) => {
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
    return { data: null, error: true, message: 'sub_types upsert 想定外の状況' };
  }
};

export const deleteSubType = async ({ isDemoLogin }: SupabaseApiAuth, { id }: any) => {
  if (isDemoLogin) return DEMO_DATA.SUPABASE.COMMON_NO_ERROR;

  const { data, error } = await supabase.from('sub_types').delete().eq('id', id);
  return { data: data, error: error, message: 'sub_type 削除' };
};
export const swapSubType = async ({ isDemoLogin }: SupabaseApiAuth, { prevId, nextId }: any) => {
  if (isDemoLogin) return DEMO_DATA.SUPABASE.COMMON_NO_ERROR;

  const { data, error } = await supabase.rpc('swap_sub_type', { id1: prevId, id2: nextId });
  return { data: data, error: error, message: 'sub_type 入替' };
};
