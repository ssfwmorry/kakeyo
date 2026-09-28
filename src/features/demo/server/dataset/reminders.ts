import 'server-only';
import {
  BaseType,
  ConditionType,
  ReminderType
} from '@/features/plan-reminder/domain/reminder-condition';
import { colors } from './colors';
import { defineTable } from './table';
import { type Owned, owner } from './users';

// reminders + conditions。実 DB では conditions が別テーブルだが、reminder 1 件に条件 1 件が
// 1:1 で付くため、ここでは条件を reminder 行に畳み込む（conditionId = reminder の id とする）。

export type DemoReminder = Owned & {
  id: number;
  name: string;
  reminderType: ReminderType;
  // YYYY-MM-DD。期日超過（date <= 今日）は通知ベルのバッジに出る。
  date: string;
  memo: string | null;
  colorId: number;
  condition: {
    conditionType: ConditionType;
    month: number | null;
    monthDay: string | null;
    baseType: BaseType | null;
  };
};

export const [reminders, reminderRows] = defineTable({
  // 歯医者は期日超過にして通知ベルのバッジが出る状態を見せる。
  dentist: {
    ...owner.self,
    name: '歯医者',
    reminderType: ReminderType.stock,
    date: '2026-09-20',
    memo: null,
    colorId: colors.red.id,
    condition: {
      conditionType: ConditionType.month,
      month: 6,
      monthDay: null,
      baseType: BaseType.now
    }
  },
  creditCheck: {
    ...owner.self,
    name: 'クレカ引落の確認',
    reminderType: ReminderType.flow,
    date: '2026-09-27',
    memo: null,
    colorId: colors.amber.id,
    condition: {
      conditionType: ConditionType.month,
      month: 1,
      monthDay: null,
      baseType: BaseType.date
    }
  },
  pairAnniversary: {
    ...owner.pair,
    name: '結婚記念日',
    reminderType: ReminderType.flow,
    date: '2026-10-05',
    memo: 'レストラン予約',
    colorId: colors.pink.id,
    condition: {
      conditionType: ConditionType.month,
      month: 12,
      monthDay: null,
      baseType: BaseType.date
    }
  }
} satisfies Record<string, Omit<DemoReminder, 'id'>>);
