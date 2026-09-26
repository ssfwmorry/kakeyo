import 'server-only';
import { colors } from './colors';
import { defineTable, indexById } from './table';
import { type Owned, owner } from './users';

// methods（支払・受取の方法）。isPay: true = 支払 / false = 受取 / null = 精算（both）。
// 相手（はなこ）の個人の方法も持つ。自分の方法一覧には現れないが、相手の立替 record が参照する。

export type DemoMethod = Owned & {
  id: number;
  name: string;
  isPay: boolean | null;
  colorId: number;
};

export const [methods, methodRows] = defineTable({
  // 自分の個人の方法。
  cash: { ...owner.self, name: '現金', isPay: true, colorId: colors.blue.id },
  credit: {
    ...owner.self,
    name: 'クレジット',
    isPay: true,
    colorId: colors.indigo.id
  },
  debit: {
    ...owner.self,
    name: '銀行引落',
    isPay: true,
    colorId: colors.blueGrey.id
  },
  transfer: {
    ...owner.self,
    name: '銀行振込',
    isPay: false,
    colorId: colors.teal.id
  },
  // ペア共有の方法。
  wallet: {
    ...owner.pair,
    name: '共有財布',
    isPay: true,
    colorId: colors.amber.id
  },
  familyCard: {
    ...owner.pair,
    name: '家族カード',
    isPay: true,
    colorId: colors.purple.id
  },
  jointDebit: {
    ...owner.pair,
    name: '共同口座引落',
    isPay: true,
    colorId: colors.blueGrey.id
  },
  jointDeposit: {
    ...owner.pair,
    name: '共同口座入金',
    isPay: false,
    colorId: colors.cyan.id
  },
  settlement: {
    ...owner.pair,
    name: '振込（精算）',
    isPay: null,
    colorId: colors.teal.id
  },
  // 相手の個人の方法。
  partnerCredit: {
    ...owner.partner,
    name: 'クレジット',
    isPay: true,
    colorId: colors.deepPurple.id
  }
} satisfies Record<string, Omit<DemoMethod, 'id'>>);

export const findMethod = indexById('methods', methodRows);
