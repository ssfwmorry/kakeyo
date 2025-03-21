import supabase from '@/composables/supabase';
import { DEMO_DATA } from '@/utils/constants';
import type { SupabaseApiAuth, SupabaseApiAuthGet, SupabaseApiAuthUpsert } from '@/utils/types/api';

export const getTypeList = async ({ isDemoLogin, userUid }: SupabaseApiAuthGet) => {
  if (isDemoLogin) return DEMO_DATA.SUPABASE.GET_TYPE_LIST;

  const payload = { input_user_id: userUid };
  const { data, error } = await supabase.rpc('get_type_list', payload);
  if (error != null) {
    return { data: data, error: error, message: 'type 一覧' };
  }

  const incomeSelf = data.filter((e: any) => !e.is_pair && !e.is_pay);
  const incomePair = data.filter((e: any) => e.is_pair && !e.is_pay);
  const paySelf = data.filter((e: any) => !e.is_pair && e.is_pay);
  const payPair = data.filter((e: any) => e.is_pair && e.is_pay);
  const getGroupedType = (data: any) => {
    let groupedData: any[] = [];
    (data ?? []).forEach((row: any, i: number) => {
      if (i == 0 || groupedData[groupedData.length - 1].type_id != row.type_id) {
        row['sub_types'] = [];
        groupedData.push(row);
      }
      if (row.sub_type_id !== null) {
        groupedData[groupedData.length - 1].sub_types.push({
          sub_type_id: row.sub_type_id,
          sub_type_name: row.sub_type_name,
          sub_type_sort: row.sub_type_sort,
        });
      }
    });
    return groupedData;
  };

  return {
    data: {
      income: {
        self: getGroupedType(incomeSelf),
        pair: getGroupedType(incomePair),
      },
      pay: {
        self: getGroupedType(paySelf),
        pair: getGroupedType(payPair),
      },
    },
    error: error,
    message: 'type 取得',
  };
};
export const upsertType = async (
  { isDemoLogin, userUid, isPair, pairId }: SupabaseApiAuthUpsert,
  { id, name, isPay, colorId }: any
) => {
  if (isDemoLogin) return DEMO_DATA.SUPABASE.COMMON_NO_ERROR;

  if (id === null) {
    // TODO よりよい状況バリデーションチェック, 他の API も
    if (isPair && pairId == null) {
      return { data: null, error: 'isPair と pairID の関係性', message: 'type 挿入' };
    }

    // 挿入
    const { data, error } = await supabase.from('types').insert([
      {
        name: name,
        user_id: isPair ? null : userUid,
        pair_id: isPair ? pairId : null,
        is_pay: isPay,
        color_classification_id: colorId,
      },
    ]);
    return { data: data, error: error, message: 'type 挿入' };
  } else if (id) {
    // 更新
    const { data, error } = await supabase
      .from('types')
      .update({
        name: name,
        color_classification_id: colorId,
      })
      .eq('id', id);
    return { data: data, error: error, message: 'type 更新' };
  } else {
    return { data: null, error: true, message: 'type upsert 想定外の状況' };
  }
};
export const deleteType = async ({ isDemoLogin }: SupabaseApiAuth, { id }: any) => {
  if (isDemoLogin) return DEMO_DATA.SUPABASE.COMMON_NO_ERROR;

  const { data, error } = await supabase.from('types').delete().eq('id', id);
  return { data: data, error: error, message: 'type 削除' };
};
export const swapType = async ({ isDemoLogin }: SupabaseApiAuth, { prevId, nextId }: any) => {
  if (isDemoLogin) return DEMO_DATA.SUPABASE.COMMON_NO_ERROR;

  const { data, error } = await supabase.rpc('swap_type', { id1: prevId, id2: nextId });
  return { data: data, error: error, message: 'type 入替' };
};
