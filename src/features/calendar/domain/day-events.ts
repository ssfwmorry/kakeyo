import type { PlanItem, ReminderItem } from '@/features/plan-reminder';

// 選択日に載る予定・リマインダーの抽出（純粋関数）。
// 月データは表示範囲分の plan と全 reminder を持つので、
// 日パネルは「その日にかかるもの」だけをここで絞る。
// 日付は JST 暦日の 'YYYY-MM-DD' 文字列で、辞書順比較がそのまま日付比較になる。

// 複数日の予定は startDate〜endDate（両端含む）のどこかが選択日なら載せる。
export function selectDayPlans(plans: PlanItem[], dateStr: string): PlanItem[] {
  return plans.filter(
    (plan) => plan.startDate <= dateStr && dateStr <= plan.endDate
  );
}

// リマインダーは単日。
export function selectDayReminders(
  reminders: ReminderItem[],
  dateStr: string
): ReminderItem[] {
  return reminders.filter((reminder) => reminder.date === dateStr);
}
