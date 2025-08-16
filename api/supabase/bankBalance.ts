import dayjs from 'dayjs';
import { camelizeKeys } from 'humps';
import { DEMO_DATA } from '~/utils/constants';
import type {
  BankBalanceListItem,
  GetBankBalanceListOutput,
  HaveLatestBankBalanceOutput,
  PostBankBalancesInput,
  PostBankBalancesOutput,
} from './bankBalance.interface';
import {
  buildNoDataApiOutput,
  type SupabaseApiDemo,
  type SupabaseApiDemoAndUser,
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

// 口座がなければnull、あればboolean
export const haveLatestBankBalance = async ({
  isDemoLogin,
  userUid,
}: SupabaseApiDemoAndUser): Promise<HaveLatestBankBalanceOutput> => {
  if (isDemoLogin) {
    return {
      data: false,
      error: null,
      message: 'デモユーザは最新の口座残高がない',
    };
  }

  const { data, error } = await supabase
    .from('bank_balances')
    .select(
      `
      created_at,
      banks!inner (
        user_id
      )`
    )
    .eq('banks.user_id', userUid)
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    return { error, message: 'bank_balances 取得' };
  }
  if (data === null || data.length === 0) {
    return {
      data: null,
      error: null,
      message: 'bank_balances 取得時にデータがありません',
    };
  }

  const latestDate = dayjs(data[0].created_at);
  const now = dayjs();

  // 最新のレコードが、1ヶ月以上前の場合はfalse
  const isAfter1Month = latestDate.isAfter(now.subtract(1, 'month'));
  return {
    data: isAfter1Month,
    error: null,
    message: '最新の bank_balance 確認',
  };
};
