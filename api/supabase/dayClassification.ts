import supabase from '~/composables/supabase';
import type {
  DbDayClassification,
  GetDayClassificationListOutput,
} from './dayClassification.interface';

export const getDayClassificationList = async (): Promise<GetDayClassificationListOutput> => {
  const { data, error } = await supabase
    .from('day_classifications')
    .select<'id, name, value', DbDayClassification>('id, name, value');
  if (error !== null || data === null) {
    return { error, message: 'day_classifications 取得' };
  }
  return { data: data, error: null, message: 'day_classifications 取得' };
};
