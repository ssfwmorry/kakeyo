import type { ReminderItem } from '@/features/plan-reminder';
import type {
  Nth,
  ReminderRule
} from '@/features/plan-reminder/domain/reminder-condition';
import { weekdayLabelJa } from '@/lib/shared/domain/format';

// リマインダーの繰り返し条件を文にする純関数。一覧の補足・詳細・追加シートの要約が使う。

// [2, 4] → 「第2・第4」、['last'] → 「最終」。
function nthsLabel(nths: Nth[]): string {
  return nths.map((nth) => (nth === 'last' ? '最終' : `第${nth}`)).join('・');
}

// rule が壊れている（null）ときは読めない旨を返す。
export function ruleText(rule: ReminderRule | null): string {
  if (rule === null) {
    return '繰り返しの設定が読めません';
  }
  switch (rule.kind) {
    case 'week':
      return rule.interval === 1
        ? `毎週 ${weekdayLabelJa(rule.weekday)}曜`
        : `${rule.interval}週ごと ${weekdayLabelJa(rule.weekday)}曜`;
    case 'nthWeek':
      return `${nthsLabel(rule.nths)} ${weekdayLabelJa(rule.weekday)}曜`;
    case 'month':
      return rule.interval === 1
        ? `毎月 ${rule.day}日`
        : `${rule.interval}か月ごと ${rule.day}日`;
    case 'monthEnd':
      return rule.interval === 1
        ? '毎月 月末'
        : `${rule.interval}か月ごと 月末`;
    case 'year':
      return `毎年 ${rule.month}月${rule.day}日`;
    case 'afterCheck':
      return `チェックした日から${rule.months}か月後`;
  }
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
  if (input.rule.kind === 'afterCheck') {
    return `${first}チェックすると、チェックした日から${input.rule.months}か月後に次のお知らせが来ます。`;
  }
  return `${first}そのあとは ${ruleText(input.rule)} にお知らせします。`;
}

// 設定の一覧は「設定されているもの」を知る場所なので期日超過も含めて全件出す
// （過ぎたものの消化はお知らせ側の役割）。日付昇順なので過ぎたものが上に来る。
export function sortedReminders(reminders: ReminderItem[]): ReminderItem[] {
  return [...reminders].sort((a, b) => a.date.localeCompare(b.date));
}
