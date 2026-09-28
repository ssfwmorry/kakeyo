import type { ReminderItem } from '@/features/plan-reminder';
import {
  ConditionType,
  calcNextReminderDate,
  ReminderType
} from '@/features/plan-reminder/domain/reminder-condition';
import { diffDaysJst } from '@/lib/shared/domain/date';

// お知らせシートに出す 1 行。リマインダーのうち期日を過ぎたものだけを、
// 表示に要る値（過ぎた日数・確認したときの次回日付）まで計算した形。
//
// サーバ側で「今日」を確定して作る。クライアントの時計に判定を委ねると
// 日付境界で件数がずれるため。

export type NotifyRow = {
  id: number;
  name: string;
  colorName: string;
  // 期日（YYYY-MM-DD）。
  date: string;
  memo: string | null;
  // 今日から見て何日過ぎているか（1 以上）。
  overdueDays: number;
  // 「確認」を押したあとの次の期日。条件が壊れていて計算できないときは null。
  nextDate: string | null;
  // 確認するとこの日の予定がカレンダーに残るか（「予定に残す」型かつ「〜か月後」型。README D16）。
  keepsPlan: boolean;
};

// 期日を過ぎた（date < today）リマインダーを日付の昇順で並べる（README D12。当日分は一覧側）。
export function buildNotifyRows(
  reminders: ReminderItem[],
  today: string
): NotifyRow[] {
  return reminders
    .filter((reminder) => reminder.date < today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((reminder) => ({
      id: reminder.id,
      name: reminder.name,
      colorName: reminder.colorName,
      date: reminder.date,
      memo: reminder.memo,
      overdueDays: diffDaysJst(today, reminder.date),
      nextDate: calcNextReminderDate({
        conditionType: reminder.conditionType,
        month: reminder.month,
        monthDay: reminder.monthDay,
        baseType: reminder.baseType,
        currentDate: reminder.date,
        today
      }),
      keepsPlan:
        reminder.reminderType === ReminderType.stock &&
        reminder.conditionType === ConditionType.month
    }));
}
