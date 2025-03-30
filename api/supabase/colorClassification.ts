import supabase from '@/composables/supabase';
import { DEMO_DATA } from '@/utils/constants';
import type {
  DbColorClassification,
  GetColorClassificationListOutput,
} from './colorClassification.interface';
import type { SupabaseApiAuth } from './common.interface';

export const getColorClassificationList = async ({
  isDemoLogin,
}: SupabaseApiAuth): Promise<GetColorClassificationListOutput> => {
  if (isDemoLogin) return DEMO_DATA.SUPABASE.GET_COLOR_LIST;

  const { data, error } = await supabase
    .from('color_classifications')
    .select<'id, name', DbColorClassification>('id, name');
  if (error !== null || data === null) {
    return { error, message: 'color_classifications 取得' };
  }

  return { data: data, error: null, message: 'color_classifications 取得' };
};
