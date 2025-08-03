import supabase from '~/composables/supabase';
import type { DbPair, GetPairIdInput, GetPairIdOutput } from './user.interface';

export const getPairId = async ({ uid }: GetPairIdInput): Promise<GetPairIdOutput> => {
  const { data, error } = await supabase
    .from('pairs')
    .select<'id', Pick<DbPair, 'id'>>('id')
    .or(`user1_id.eq.${uid},user2_id.eq.${uid}`);
  if (error != null) {
    return { error: error, message: 'pair_id 取得' };
  } else if (data.length > 1) {
    return { error: 'DBの状態がおかしい', message: 'pair_id 取得' };
  } else if (data.length == 0) {
    return { data: null, error: null, message: 'pair_未登録' };
  }
  return { data: data[0].id, error: null, message: 'get pair_id' };
};
