import supabase from '~/composables/supabase';
import type {
  DbColorClassification,
  GetColorClassificationListOutput,
} from './colorClassification.interface';

export const getColorClassificationList = async (): Promise<GetColorClassificationListOutput> => {
  const { data, error } = await supabase
    .from('color_classifications')
    .select<'id, name', DbColorClassification>('id, name');
  if (error !== null || data === null) {
    return { error, message: 'color_classifications 取得' };
  }

  return { data: data, error: null, message: 'color_classifications 取得' };
};
