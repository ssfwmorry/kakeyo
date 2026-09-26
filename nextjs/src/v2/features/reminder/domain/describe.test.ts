import { describe, expect, it } from 'vitest';
import type { ReminderItem } from '@/features/plan-reminder';
import {
  reminderTypeText,
  ruleText,
  summaryText,
  upcomingReminders
} from './describe';

describe('ruleText', () => {
  it('毎年は月日を出す', () => {
    expect(
      ruleText({
        conditionType: 10,
        month: null,
        monthDay: '12-01',
        baseType: null
      })
    ).toBe('毎年 12月1日');
  });

  it('〜か月後は基準の日を出す', () => {
    expect(
      ruleText({ conditionType: 5, month: 3, monthDay: null, baseType: 5 })
    ).toBe('チェックした日から3か月後');
    expect(
      ruleText({ conditionType: 5, month: 1, monthDay: null, baseType: 10 })
    ).toBe('リマインド日から1か月後');
  });
});

describe('reminderTypeText', () => {
  it('予定に残すか残さないか', () => {
    expect(reminderTypeText(10)).toBe('予定に残す');
    expect(reminderTypeText(5)).toBe('残さない（次の日付に進むだけ）');
  });
});

describe('summaryText', () => {
  const firstDate = { month: 10, day: 2 };

  it('名前が空なら前半を省く', () => {
    expect(
      summaryText({
        name: ' ',
        firstDate,
        rule: { conditionType: 5, month: 1, monthDay: null, baseType: 5 }
      })
    ).toBe(
      '10月2日にお知らせします。チェックすると、チェックした日から1か月後に次のお知らせが来ます。'
    );
  });

  it('リマインド日からは「お知らせの日」と言う', () => {
    expect(
      summaryText({
        name: '歯医者',
        firstDate,
        rule: { conditionType: 5, month: 3, monthDay: null, baseType: 10 }
      })
    ).toBe(
      '「歯医者」を10月2日にお知らせします。チェックすると、お知らせの日から3か月後に次のお知らせが来ます。'
    );
  });

  it('毎年', () => {
    expect(
      summaryText({
        name: '自動車税',
        firstDate: { month: 5, day: 1 },
        rule: {
          conditionType: 10,
          month: null,
          monthDay: '05-01',
          baseType: null
        }
      })
    ).toBe(
      '「自動車税」を5月1日にお知らせします。そのあとは毎年 5月1日にお知らせします。'
    );
  });
});

describe('upcomingReminders', () => {
  const item = (id: number, date: string): ReminderItem => ({
    id,
    name: `r${id}`,
    reminderType: 5,
    date,
    memo: null,
    colorClassificationId: 1,
    colorName: 'red',
    isPair: false,
    conditionId: id,
    conditionType: 5,
    month: 1,
    monthDay: null,
    baseType: 5
  });

  it('今日以降だけを日付順に並べる', () => {
    const rows = upcomingReminders(
      [item(1, '2026-10-05'), item(2, '2026-09-20'), item(3, '2026-09-25')],
      '2026-09-25'
    );
    expect(rows.map((row) => row.id)).toEqual([3, 1]);
  });
});
