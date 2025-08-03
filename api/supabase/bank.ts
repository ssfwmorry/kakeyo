import { camelizeKeys } from 'humps';
import { DEMO_DATA } from '~/utils/constants';
import type {
  GetBankListItem,
  GetBankListOutput,
  UpsertBankInput,
  UpsertBankOutput,
} from './bank.interface';
import {
  buildNoDataApiOutput,
  type DeleteInput,
  type DeleteOutput,
  type SupabaseApiDemo,
  type SupabaseApiDemoAndUser,
  type SupabaseApiUser,
} from './common.interface';

export const getBankList = async ({ userUid }: SupabaseApiUser): Promise<GetBankListOutput> => {
  // TODO: 型を調整する
  const { data, error } = await supabase
    .from('banks')
    .select(
      `
      id,
      user_id,
      name,
      color_classification_id,
      color_classifications (id, name)
    `
    )
    .or(`user_id.eq.${userUid}`);

  if (error != null || data === null) {
    return { error: error, message: 'bank 一覧' };
  }

  const camelizedData = camelizeKeys({ data }) as { data: GetBankListItem[] };
  return {
    data: camelizedData.data,
    error: null,
    message: 'bank 一覧',
  };
};

export const upsertBank = async (
  { isDemoLogin, userUid }: SupabaseApiDemoAndUser,
  { id, name, colorId }: UpsertBankInput
): Promise<UpsertBankOutput> => {
  if (isDemoLogin) return DEMO_DATA.SUPABASE.COMMON_NO_ERROR;

  if (id === null) {
    // 挿入
    const { error } = await supabase.from('banks').insert([
      {
        user_id: userUid,
        name,
        color_classification_id: colorId,
      },
    ]);
    return buildNoDataApiOutput(error, 'bank 挿入');
  } else {
    // 更新
    const { error } = await supabase
      .from('banks')
      .update({
        name,
        color_classification_id: colorId,
      })
      .eq('id', id);
    return buildNoDataApiOutput(error, 'bank 更新');
  }
};

export const deleteBank = async (
  { isDemoLogin }: SupabaseApiDemo,
  { id }: DeleteInput
): Promise<DeleteOutput> => {
  if (isDemoLogin) return DEMO_DATA.SUPABASE.COMMON_NO_ERROR;

  const { error } = await supabase.from('banks').delete().eq('id', id);
  return buildNoDataApiOutput(error, 'bank 削除');
};
