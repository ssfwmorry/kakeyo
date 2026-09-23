import 'server-only';
import { colors } from './colors';
import { defineTable, indexById } from './table';
import { type Owned, owner } from './users';

// plan_types（予定カテゴリ）。

export type DemoPlanType = Owned & {
  id: number;
  name: string;
  colorId: number;
  sort: number;
};

export const [planTypes, planTypeRows] = defineTable({
  work: { ...owner.self, name: '仕事', colorId: colors.blue.id, sort: 1 },
  private: {
    ...owner.self,
    name: 'プライベート',
    colorId: colors.green.id,
    sort: 2
  },
  pairFamily: { ...owner.pair, name: '家族', colorId: colors.pink.id, sort: 1 },
  pairAnniversary: {
    ...owner.pair,
    name: '記念日',
    colorId: colors.red.id,
    sort: 2
  }
} satisfies Record<string, Omit<DemoPlanType, 'id'>>);

export const findPlanType = indexById('plan_types', planTypeRows);
