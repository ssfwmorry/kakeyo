import 'server-only';
import { planTypes } from './plan-types';
import { defineTable } from './table';
import { type Owned, owner } from './users';

// plans（予定）。日付は YYYY-MM-DD（JST 暦日）。reminder 由来の予定は無い（reminderId=null）。

export type DemoPlan = Owned & {
  id: number;
  startDate: string;
  endDate: string;
  name: string;
  memo: string | null;
  planTypeId: number | null;
  reminderId: number | null;
};

export const [plans, planRows] = defineTable({
  webMeeting: {
    ...owner.self,
    startDate: '2026-09-24',
    endDate: '2026-09-24',
    name: 'WEB 会議',
    memo: 'zoom',
    planTypeId: planTypes.work.id,
    reminderId: null
  },
  hotSpring: {
    ...owner.self,
    startDate: '2026-09-26',
    endDate: '2026-09-27',
    name: '温泉旅行',
    memo: null,
    planTypeId: planTypes.private.id,
    reminderId: null
  },
  pairFamilyDinner: {
    ...owner.pair,
    startDate: '2026-09-28',
    endDate: '2026-09-28',
    name: '両家で食事',
    memo: '18:00〜',
    planTypeId: planTypes.pairFamily.id,
    reminderId: null
  }
} satisfies Record<string, Omit<DemoPlan, 'id'>>);
