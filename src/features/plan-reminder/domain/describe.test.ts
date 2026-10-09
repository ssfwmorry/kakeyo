import { describe, expect, it } from 'vitest';
import type { ReminderItem } from '@/features/plan-reminder';
import { ruleText, sortedReminders, summaryText } from './describe';

describe('ruleText', () => {
  it('週ごと（interval=1 は「毎週」）', () => {
    expect(ruleText({ kind: 'week', interval: 1, weekday: 1 })).toBe(
      '毎週 月曜'
    );
    expect(ruleText({ kind: 'week', interval: 2, weekday: 6 })).toBe(
      '2週ごと 土曜'
    );
  });

  it('第 N 曜日は複数を「・」で連結する', () => {
    expect(ruleText({ kind: 'nthWeek', nths: [2, 4], weekday: 3 })).toBe(
      '第2・第4 水曜'
    );
    expect(ruleText({ kind: 'nthWeek', nths: ['last'], weekday: 5 })).toBe(
      '最終 金曜'
    );
  });

  it('月ごと（interval=1 は「毎月」）', () => {
    expect(ruleText({ kind: 'month', interval: 1, day: 15 })).toBe('毎月 15日');
    expect(ruleText({ kind: 'month', interval: 3, day: 1 })).toBe(
      '3か月ごと 1日'
    );
  });

  it('月末', () => {
    expect(ruleText({ kind: 'monthEnd', interval: 1 })).toBe('毎月 月末');
    expect(ruleText({ kind: 'monthEnd', interval: 2 })).toBe('2か月ごと 月末');
  });

  it('毎年は月日を出す', () => {
    expect(ruleText({ kind: 'year', month: 12, day: 1 })).toBe('毎年 12月1日');
  });

  it('先送りはチェックした日から数える', () => {
    expect(ruleText({ kind: 'afterCheck', months: 3 })).toBe(
      'チェックした日から3か月後'
    );
  });

  it('rule が壊れていれば読めない旨を出す', () => {
    expect(ruleText(null)).toBe('繰り返しの設定が読めません');
  });
});

describe('summaryText', () => {
  const firstDate = { month: 10, day: 2 };

  it('名前が空なら前半を省く', () => {
    expect(
      summaryText({
        name: ' ',
        firstDate,
        rule: { kind: 'afterCheck', months: 1 }
      })
    ).toBe(
      '10月2日にお知らせします。チェックすると、チェックした日から1か月後に次のお知らせが来ます。'
    );
  });

  it('先送りはチェック起点の言い回しにする', () => {
    expect(
      summaryText({
        name: '歯医者',
        firstDate,
        rule: { kind: 'afterCheck', months: 3 }
      })
    ).toBe(
      '「歯医者」を10月2日にお知らせします。チェックすると、チェックした日から3か月後に次のお知らせが来ます。'
    );
  });

  it('繰り返し系は ruleText をそのまま使う', () => {
    expect(
      summaryText({
        name: '自動車税',
        firstDate: { month: 5, day: 1 },
        rule: { kind: 'year', month: 5, day: 1 }
      })
    ).toBe(
      '「自動車税」を5月1日にお知らせします。そのあとは 毎年 5月1日 にお知らせします。'
    );
    expect(
      summaryText({
        name: '資源ごみ',
        firstDate: { month: 10, day: 7 },
        rule: { kind: 'nthWeek', nths: [1, 3], weekday: 3 }
      })
    ).toBe(
      '「資源ごみ」を10月7日にお知らせします。そのあとは 第1・第3 水曜 にお知らせします。'
    );
  });
});

describe('sortedReminders', () => {
  const item = (id: number, date: string): ReminderItem => ({
    id,
    name: `r${id}`,
    date,
    memo: null,
    colorClassificationId: 1,
    colorName: 'red',
    isPair: false,
    rule: { kind: 'month', interval: 1, day: 1 }
  });

  it('期日を過ぎたものも含めて日付昇順に並べる', () => {
    const rows = sortedReminders([
      item(1, '2026-10-05'),
      item(2, '2026-09-20'),
      item(3, '2026-09-25')
    ]);
    expect(rows.map((row) => row.id)).toEqual([2, 3, 1]);
  });

  it('元の配列を書き換えない', () => {
    const input = [item(1, '2026-10-05'), item(2, '2026-09-20')];
    sortedReminders(input);
    expect(input.map((row) => row.id)).toEqual([1, 2]);
  });
});
