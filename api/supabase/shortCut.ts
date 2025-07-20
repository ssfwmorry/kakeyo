import { camelizeKeys } from 'humps';
import type { SupabaseApiUser } from './common.interface';
import type { GetShortCutListItem, GetShortCutListOutput } from './shortCut.interface';

export const getShortCutList = async ({
  userUid,
}: SupabaseApiUser): Promise<GetShortCutListOutput> => {
  // TODO: 型を調整する
  const { data, error } = await supabase
    .from('short_cuts')
    .select(
      `
      id,
      user_id,
      pair_id,
      is_pay,
      method_id,
      type_id,
      sub_type_id,
      price,
      memo,
      record_type,
      types (
        id,
        name,
        color_classifications (id, name)
      ),
      sub_types (id, name),
      methods (
        id,
        name,
        color_classifications (id, name)
      )
    `
    )
    .or(`user_id.eq.${userUid}`);

  if (error != null || data === null) {
    return { error: error, message: 'short_cut 一覧' };
  }

  // TODO: 型を調整する
  const camelizedData = camelizeKeys({ data }) as { data: GetShortCutListItem[] };
  return {
    data: camelizedData.data,
    error: null,
    message: 'short_cut 一覧',
  };
};
