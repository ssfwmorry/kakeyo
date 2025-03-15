import supabase from '@/composables/supabase';
import { DEMO_DATA } from '@/utils/constants';
import type { SupabaseApiAuth } from '@/utils/types/api';
import type { PostgrestError } from '@supabase/supabase-js';

export const getColorClassificationList = async ({ isDemoLogin }: SupabaseApiAuth) => {
  if (isDemoLogin) return DEMO_DATA.SUPABASE.GET_COLOR_LIST;

  const { data, error } = (await supabase.from('color_classifications').select('id, name')) as {
    data: { id: number; name: string }[] | null;
    error: PostgrestError | null;
  };
  return { data: data, error: error, message: 'color_classifications 取得' };
};
