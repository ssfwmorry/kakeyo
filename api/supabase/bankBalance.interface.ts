import type { PostgrestError } from '@supabase/supabase-js';
import type { ColorString, DbDatetimeString, Id } from '~/utils/types/common';
import type { BankBalance } from '~/utils/types/model';
import type { ApiOutput } from './common.interface';

export type BankBalanceListItem = {
  id: Id;
  bankId: Id;
  price: number;
  createdAt: DbDatetimeString;
  banks: {
    id: Id;
    userId: Id;
    name: string;
    colorClassificationId: Id;
    colorClassifications: {
      id: Id;
      name: ColorString;
    };
  };
};

export type GetBankBalanceListBalanceItem = {
  createdAt: DbDatetimeString;
  banks: {
    [id: string]: {
      price: number;
      color: ColorString;
    };
  };
  sum: number; // 合計金額
};
export interface GetBankBalanceListOutput
  extends ApiOutput<GetBankBalanceListBalanceItem[], PostgrestError> {}

export interface PostBankBalancesInput {
  balances: Pick<BankBalance, 'bankId' | 'price'>[];
}
export interface PostBankBalancesOutput extends ApiOutput<null, PostgrestError> {}
