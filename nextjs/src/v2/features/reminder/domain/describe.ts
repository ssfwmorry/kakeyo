import type { ReminderItem } from '@/features/plan-reminder';
import {
  BaseType,
  ConditionType,
  ReminderType
} from '@/features/plan-reminder/domain/reminder-condition';

// リマインダーの条件を文にする純関数。一覧の補足・詳細・追加シートの要約が使う。

// 条件（DB の condition 行と同じ形）。追加シートの入力中の値もこの形に寄せて渡す。
export type ReminderRule = {
  conditionType: number;
  month: number | null;
  monthDay: string | null;
  baseType: number | null;
};

// 'MM-DD' → { month, day }。壊れていれば null。
export function parseMonthDay(
  monthDay: string | null
): { month: number; day: number } | null {
  if (monthDay === null) {
    return null;
  }
  const [month, day] = monthDay.split('-').map(Number);
  if (!Number.isInteger(month) || !Number.isInteger(day)) {
    return null;
  }
  return { month, day };
}

// 「毎年 12月1日」「チェックした日から3か月後」。
export function ruleText(rule: ReminderRule): string {
  if (rule.conditionType === ConditionType.monthDay) {
    const parsed = parseMonthDay(rule.monthDay);
    return parsed === null ? '毎年' : `毎年 ${parsed.month}月${parsed.day}日`;
  }
  const base =
    rule.baseType === BaseType.date ? 'リマインド日' : 'チェックした日';
  return `${base}から${rule.month ?? 1}か月後`;
}

// 「予定に残す」「残さない（次の日付に進むだけ）」。
export function reminderTypeText(reminderType: number): string {
  return reminderType === ReminderType.stock
    ? '予定に残す'
    : '残さない（次の日付に進むだけ）';
}

// 追加シートの要約。名前が空なら前半を省く。
export function summaryText(input: {
  name: string;
  firstDate: { month: number; day: number };
  rule: ReminderRule;
}): string {
  const trimmed = input.name.trim();
  const head = trimmed === '' ? '' : `「${trimmed}」を`;
  const first = `${head}${input.firstDate.month}月${input.firstDate.day}日にお知らせします。`;
  if (input.rule.conditionType === ConditionType.monthDay) {
    const parsed = parseMonthDay(input.rule.monthDay);
    const when = parsed === null ? '' : ` ${parsed.month}月${parsed.day}日`;
    return `${first}そのあとは毎年${when}にお知らせします。`;
  }
  const base =
    input.rule.baseType === BaseType.date ? 'お知らせの日' : 'チェックした日';
  return `${first}チェックすると、${base}から${input.rule.month ?? 1}か月後に次のお知らせが来ます。`;
}

// 一覧に出すのは今日以降のものだけ。近い日付の順（README D12。過ぎたものはお知らせ側）。
export function upcomingReminders(
  reminders: ReminderItem[],
  today: string
): ReminderItem[] {
  return reminders
    .filter((reminder) => reminder.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date));
}
