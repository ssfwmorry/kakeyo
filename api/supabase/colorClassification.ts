import supabase from '@/composables/supabase';
import { DEMO_DATA } from '@/utils/constants';
import type { SupabaseApiAuth } from '@/utils/types/api';
import type { GetColorClassificationListOutput } from './colorClassification.interface';

export const getColorClassificationList = async ({
  isDemoLogin,
}: SupabaseApiAuth): Promise<GetColorClassificationListOutput> => {
  if (isDemoLogin) return DEMO_DATA.SUPABASE.GET_COLOR_LIST;

  const { data, error } = await supabase.from('color_classifications').select('id, name');
  return { data: data, error: error, message: 'color_classifications 取得' };
};
