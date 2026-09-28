import 'server-only';
import { defineTable } from './table';
import { type Owned, owner } from './users';

// memos（TODO）。個人 TODO とペア共有 TODO。

export type DemoMemo = Owned & { id: number; memo: string };

export const [memos, memoRows] = defineTable({
  milk: { ...owner.self, memo: '牛乳を買う' },
  electricity: { ...owner.self, memo: '電気代を振り込む' },
  pairToiletPaper: { ...owner.pair, memo: 'トイレットペーパー補充' }
} satisfies Record<string, Omit<DemoMemo, 'id'>>);
