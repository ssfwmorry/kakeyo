import supabase from '@/composables/supabase';
import { DEMO_DATA } from '@/utils/constants';
import type { SupabaseApiAuth } from '@/utils/types/api';

export const getDayClassificationList = async ({ isDemoLogin }: SupabaseApiAuth) => {
  if (isDemoLogin) return DEMO_DATA.SUPABASE.GET_DAY_LIST;

  const { data, error } = await supabase.from('day_classifications').select('id, name, value');
  return { data: data, error: error, message: 'day_classifications 取得' };
};
