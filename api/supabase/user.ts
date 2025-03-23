import supabase from '@/composables/supabase';
import type { Id } from '@/utils/types/common';
import type { GetPairIdInput, GetPairIdOutput } from './user.interface';

export const getPairId = async ({ uid }: GetPairIdInput): Promise<GetPairIdOutput> => {
  const { data, error } = await supabase
    .from('pairs')
    .select('id')
    .or(`user1_id.eq.${uid},user2_id.eq.${uid}`);
  if (error != null) {
    return { data: data, error: error, message: 'pair_id 取得' };
  } else if (data.length > 1) {
    return { data: null, error: 'DBの状態がおかしい', message: 'pair_id 取得' };
  } else if (data.length == 0) {
    return { data: null, error: null, message: 'pair_未登録' };
  }
  return { data: data[0].id as Id, error: null, message: 'get pair_id' };
};
