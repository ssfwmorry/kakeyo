import { colorHex } from '@/features/master';
import type { CalendarEvent, CalendarMonthData } from '../types';
import { formatDaySum } from './format';

// CalendarMonthData → カレンダー表示イベント（純粋関数）。
// plan / reminder / 日別収支を素朴な CalendarEvent[] に落とす（FullCalendar の EventInput への最終変換は Client 側）。
// 祝日はイベントとしては出さずセル日付ラベルへ付す
//   （FullCalendar の背景イベントは daygrid で扱いが煩雑なため。祝日名は DaySum が保持）。

// 日別収支ラベル（記録があり合計が非 0/または記録ありのときのみ数字を出す）。
function daySumTitle(sum: number, recordCount: number): string {
  if (recordCount === 0) {
    return '';
  }
  return formatDaySum(sum);
}

export function buildCalendarEvents(data: CalendarMonthData): CalendarEvent[] {
  const events: CalendarEvent[] = [];

  // 予定（複数日対応。FullCalendar の end は排他的なので Client 側で +1 日する）。
  for (const plan of data.plans) {
    events.push({
      kind: 'plan',
      start: plan.startDate,
      end: plan.endDate,
      title: plan.name,
      colorHex: colorHex(
        plan.planTypeColorName ?? plan.reminderColorName ?? 'grey'
      ),
      planId: plan.id,
      reminderId: plan.reminderId,
      tone: null
    });
  }

  // リマインダー（単日）。
  for (const reminder of data.reminders) {
    events.push({
      kind: 'reminder',
      start: reminder.date,
      end: reminder.date,
      title: reminder.name,
      colorHex: colorHex(reminder.colorName),
      planId: null,
      reminderId: reminder.id,
      tone: null
    });
  }

  // 日別収支（記録がある日のみ数字ラベル）。
  for (const day of data.days) {
    const title = daySumTitle(day.sum, day.records.length);
    if (title === '') {
      continue;
    }
    events.push({
      kind: 'daySum',
      start: day.dateStr,
      end: day.dateStr,
      title,
      colorHex: null,
      planId: null,
      reminderId: null,
      // sum は「支出=正」向き。負なら収入超過。
      tone: day.sum < 0 ? 'income' : 'expense'
    });
  }

  return events;
}
