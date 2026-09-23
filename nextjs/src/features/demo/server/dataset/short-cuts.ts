import 'server-only';
import { resolveRecordType } from '@/lib/shared/domain/recordType';
import type { RecordType } from '@/lib/shared/types/recordType';
import { methods } from './methods';
import { defineTable } from './table';
import { subTypes, types } from './types';
import { demoUsers } from './users';

// short_cuts（記録ショートカット）。個人専用テーブルだが、共有 record（record_type=10）を
// 起票するものは作れる。その場合はペアのカテゴリ・方法を参照する。

export type DemoShortCut = {
  id: number;
  userUid: string;
  isPay: boolean;
  price: number;
  memo: string | null;
  recordType: RecordType;
  methodId: number;
  typeId: number;
  subTypeId: number | null;
};

export const [shortCuts, shortCutRows] = defineTable({
  lunch: {
    userUid: demoUsers.self.uid,
    isPay: true,
    price: 500,
    memo: 'ランチ',
    recordType: resolveRecordType({ isPair: false, isInstead: false }),
    methodId: methods.cash.id,
    typeId: types.food.id,
    subTypeId: subTypes.eatOut.id
  },
  train: {
    userUid: demoUsers.self.uid,
    isPay: true,
    price: 200,
    memo: '電車',
    recordType: resolveRecordType({ isPair: false, isInstead: false }),
    methodId: methods.cash.id,
    typeId: types.transport.id,
    subTypeId: null
  },
  pairShopping: {
    userUid: demoUsers.self.uid,
    isPay: true,
    price: 6000,
    memo: '週末の買い出し',
    recordType: resolveRecordType({ isPair: true, isInstead: false }),
    methodId: methods.familyCard.id,
    typeId: types.pairFood.id,
    subTypeId: subTypes.pairGrocery.id
  }
} satisfies Record<string, Omit<DemoShortCut, 'id'>>);
