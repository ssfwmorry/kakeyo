import 'server-only';
import { colors } from './colors';
import { defineTable, indexById } from './table';
import { type Owned, owner } from './users';

// types / sub_types（カテゴリ・サブカテゴリ）。
// 自分の個人カテゴリと、ペア共有カテゴリを 1 テーブルに持つ（所有者は owner で表す）。
// solo デモには owner.self の行だけが見える（scope.ts）。

export type DemoType = Owned & {
  id: number;
  name: string;
  isPay: boolean;
  colorId: number;
};

export const [types, typeRows] = defineTable({
  // 自分の個人カテゴリ。
  food: { ...owner.self, name: '食費', isPay: true, colorId: colors.orange.id },
  daily: {
    ...owner.self,
    name: '日用品',
    isPay: true,
    colorId: colors.green.id
  },
  transport: {
    ...owner.self,
    name: '交通費',
    isPay: true,
    colorId: colors.blue.id
  },
  housing: {
    ...owner.self,
    name: '住居',
    isPay: true,
    colorId: colors.brown.id
  },
  salary: {
    ...owner.self,
    name: '給与',
    isPay: false,
    colorId: colors.teal.id
  },
  // ペア共有カテゴリ。
  pairFood: {
    ...owner.pair,
    name: '食費',
    isPay: true,
    colorId: colors.orange.id
  },
  pairDaily: {
    ...owner.pair,
    name: '日用品',
    isPay: true,
    colorId: colors.green.id
  },
  pairUtility: {
    ...owner.pair,
    name: '光熱費',
    isPay: true,
    colorId: colors.amber.id
  },
  pairHousing: {
    ...owner.pair,
    name: '住居',
    isPay: true,
    colorId: colors.brown.id
  },
  pairAllowance: {
    ...owner.pair,
    name: '手当',
    isPay: false,
    colorId: colors.cyan.id
  }
} satisfies Record<string, Omit<DemoType, 'id'>>);

export const findType = indexById('types', typeRows);

// sub_types。親カテゴリ（typeId）に属し、可視性は親に従う。
export type DemoSubType = {
  id: number;
  typeId: number;
  name: string;
};

export const [subTypes, subTypeRows] = defineTable({
  eatOut: { typeId: types.food.id, name: '外食' },
  grocery: { typeId: types.food.id, name: '食料品' },
  pairEatOut: { typeId: types.pairFood.id, name: '外食' },
  pairGrocery: { typeId: types.pairFood.id, name: '食料品' }
} satisfies Record<string, Omit<DemoSubType, 'id'>>);

export const findSubType = indexById('sub_types', subTypeRows);

export function subTypesOf(typeId: number): DemoSubType[] {
  return subTypeRows.filter((row) => row.typeId === typeId);
}
