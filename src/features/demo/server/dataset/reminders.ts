import 'server-only';
import type { ReminderRule } from '@/features/plan-reminder/domain/reminder-condition';
import { colors } from './colors';
import { defineTable } from './table';
import { type Owned, owner } from './users';

// reminders。繰り返し条件は実 DB と同じく rule（判別共用体）1 本で持つ。
// 設定画面はペアモードに応じて self / pair のどちらか一方だけを表示するため、
// どちらのモードで見ても複数の kind が見えるよう所有を振り分ける。

export type DemoReminder = Owned & {
  id: number;
  name: string;
  // YYYY-MM-DD。期日超過（date < 今日）は通知ベルのバッジに出る。
  date: string;
  memo: string | null;
  colorId: number;
  rule: ReminderRule;
};

export const [reminders, reminderRows] = defineTable({
  // 歯医者は期日超過にして通知ベルのバッジが出る状態を見せる。
  dentist: {
    ...owner.self,
    name: '歯医者',
    date: '2026-09-20',
    memo: null,
    colorId: colors.red.id,
    rule: { kind: 'afterCheck', months: 6 }
  },
  creditCheck: {
    ...owner.self,
    name: 'クレカ引落の確認',
    date: '2026-09-27',
    memo: null,
    colorId: colors.amber.id,
    rule: { kind: 'month', interval: 1, day: 27 }
  },
  garbage: {
    ...owner.pair,
    name: '資源ごみ',
    date: '2026-10-07',
    memo: null,
    colorId: colors.green.id,
    // 第 1・第 3 水曜。
    rule: { kind: 'nthWeek', nths: [1, 3], weekday: 3 }
  },
  rentTransfer: {
    ...owner.pair,
    name: '家賃の振込',
    date: '2026-10-31',
    memo: null,
    colorId: colors.blue.id,
    rule: { kind: 'monthEnd', interval: 1 }
  },
  cleaning: {
    ...owner.self,
    name: '大掃除',
    date: '2026-10-10',
    memo: null,
    colorId: colors.teal.id,
    // 隔週の土曜。
    rule: { kind: 'week', interval: 2, weekday: 6 }
  },
  pairAnniversary: {
    ...owner.pair,
    name: '結婚記念日',
    date: '2026-10-05',
    memo: 'レストラン予約',
    colorId: colors.pink.id,
    rule: { kind: 'year', month: 10, day: 5 }
  }
} satisfies Record<string, Omit<DemoReminder, 'id'>>);
