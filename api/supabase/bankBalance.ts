import dayjs from 'dayjs';
import { camelizeKeys } from 'humps';
import { DEMO_DATA } from '~/utils/constants';
import type {
  BankBalanceListItem,
  GetBankBalanceListOutput,
  PostBankBalancesInput,
  PostBankBalancesOutput,
} from './bankBalance.interface';
import {
  buildNoDataApiOutput,
  type SupabaseApiDemo,
  type SupabaseApiUser,
} from './common.interface';

export const getBankBalanceList = async ({
  userUid,
}: SupabaseApiUser): Promise<GetBankBalanceListOutput> => {
  const now = new Date();
  const ago2Years = dayjs(now).subtract(2, 'year');

  const { data, error } = await supabase
    .from('bank_balances')
    .select(
      `
      id,
      bank_id,
      price,
      created_at,
      banks!inner (
        id,
        user_id,
        name,
        color_classification_id,
        color_classifications (id, name)
      )
    `
    )
    .eq(`banks.user_id`, userUid)
    .gt('created_at', ago2Years.format(format.Date))
    .order('created_at', { ascending: true });

  if (error !== null || data === null) {
    return { error, message: 'bank_balances 取得' };
  }

  const camelizedData = camelizeKeys({ data }) as { data: BankBalanceListItem[] };

  // 整形
  const outData: GetBankBalanceListOutput['data'] = [];
  camelizedData.data.forEach((row) => {
    const existingBalance = outData.find((balance) => balance.createdAt === row.createdAt);
    if (existingBalance) {
      // 既存の日付のエントリに追加
      existingBalance.banks[String(row.bankId)] = {
        price: row.price,
        color: row.banks.colorClassifications.name,
      };
      existingBalance.sum += row.price;
      return;
    } else {
      // 新しい日付のエントリを作成
      outData.push({
        createdAt: row.createdAt,
        banks: {
          [String(row.bankId)]: {
            price: row.price,
            color: row.banks.colorClassifications.name,
          },
        },
        sum: row.price,
      });
    }
  });

  return { data: outData, error: null, message: 'bank_balances 取得' };
};

export const postBankBalances = async (
  { isDemoLogin }: SupabaseApiDemo,
  { balances }: PostBankBalancesInput
): Promise<PostBankBalancesOutput> => {
  if (isDemoLogin) return DEMO_DATA.SUPABASE.COMMON_NO_ERROR;

  const { error } = await supabase.from('bank_balances').insert(
    balances.map((balance) => ({
      bank_id: balance.bankId,
      price: balance.price,
    }))
  );
  return buildNoDataApiOutput(error, 'bank_balance 登録');
};
