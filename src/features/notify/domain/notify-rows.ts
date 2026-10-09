import type { ReminderItem } from '@/features/plan-reminder';
import { calcNextReminderDate } from '@/features/plan-reminder/domain/reminder-condition';
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
  date: string;
  memo: string | null;
  // 1 以上（当日分は一覧側が持つため 0 は現れない）。
  overdueDays: number;
  // 「確認」を押したあとの次の期日。条件が壊れていて計算できないときは null。
  nextDate: string | null;
};

// 期日を過ぎた（date < today）ものだけを日付の昇順で並べる。
// 当日分はまだ消化の対象ではないので、設定の一覧側に任せてここには出さない。
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
        rule: reminder.rule,
        currentDate: reminder.date,
        today
      })
    }));
}
