import { describe, expect, it } from 'vitest';
import {
  calcNextReminderDate,
  parseReminderRule,
  type ReminderRule
} from './reminder-condition';

// 次回リマインド日の計算（純粋関数）の Vitest。
// 存在しない日の扱いが kind ごとに違う（afterCheck=繰り越し / month=押し込み）のが要。

const TODAY = '2026-09-25';

function next(
  rule: ReminderRule,
  currentDate: string,
  today = TODAY
): string | null {
  return calcNextReminderDate({ rule, currentDate, today });
}

describe('calcNextReminderDate: afterCheck', () => {
  it('today から N ヶ月後（繰り返しではなく先送りなので date は見ない）', () => {
    expect(next({ kind: 'afterCheck', months: 3 }, '2020-01-01')).toBe(
      '2026-12-25'
    );
  });

  it('存在しない日は翌月へ繰り越す（8/31 + 3 ヶ月 = 12/1）', () => {
    expect(
      next({ kind: 'afterCheck', months: 3 }, '2026-01-01', '2026-08-31')
    ).toBe('2026-12-01');
  });

  it('1/31 + 1 ヶ月 = 3/3（平年は 2 月が 28 日なので 3 日溢れる）', () => {
    expect(
      next({ kind: 'afterCheck', months: 1 }, '2026-01-01', '2026-01-31')
    ).toBe('2026-03-03');
  });
});

describe('calcNextReminderDate: month', () => {
  it('毎月 31 日は 1/31 → 2/28 → 3/31 と復帰する（rule が day を保つ）', () => {
    const rule: ReminderRule = { kind: 'month', interval: 1, day: 31 };
    expect(next(rule, '2026-01-31', '2026-02-01')).toBe('2026-02-28');
    expect(next(rule, '2026-02-28', '2026-03-01')).toBe('2026-03-31');
  });

  it('interval=3 の四半期', () => {
    expect(
      next({ kind: 'month', interval: 3, day: 10 }, '2026-09-10', '2026-09-25')
    ).toBe('2026-12-10');
  });

  it('年跨ぎ（11 月 → 翌 2 月）', () => {
    expect(
      next({ kind: 'month', interval: 3, day: 10 }, '2026-11-10', '2026-12-01')
    ).toBe('2027-02-10');
  });
});

describe('calcNextReminderDate: monthEnd', () => {
  it('常にその月の末日（1/31 → 2/28 → 3/31）', () => {
    const rule: ReminderRule = { kind: 'monthEnd', interval: 1 };
    expect(next(rule, '2026-01-31', '2026-02-01')).toBe('2026-02-28');
    expect(next(rule, '2026-02-28', '2026-03-01')).toBe('2026-03-31');
  });

  it('うるう年は 2/29', () => {
    expect(
      next({ kind: 'monthEnd', interval: 1 }, '2024-01-31', '2024-02-01')
    ).toBe('2024-02-29');
  });
});

describe('calcNextReminderDate: week', () => {
  it('interval=1 は毎週（同じ曜日のまま 7 日後）', () => {
    // 2026-09-24 は木曜。
    expect(
      next(
        { kind: 'week', interval: 1, weekday: 4 },
        '2026-09-24',
        '2026-09-25'
      )
    ).toBe('2026-10-01');
  });

  it('interval=3 でも曜日が保たれる', () => {
    const result = next(
      { kind: 'week', interval: 3, weekday: 4 },
      '2026-09-24',
      '2026-09-25'
    );
    expect(result).toBe('2026-10-15');
  });
});

describe('calcNextReminderDate: nthWeek', () => {
  it('nths: [2, 4] の水曜が 第 2 → 第 4 → 翌月第 2 と進む', () => {
    const rule: ReminderRule = { kind: 'nthWeek', nths: [2, 4], weekday: 3 };
    // 2026-10 の水曜: 7, 14, 21, 28 → 第 2=14, 第 4=28。
    expect(next(rule, '2026-10-01', '2026-10-01')).toBe('2026-10-14');
    expect(next(rule, '2026-10-14', '2026-10-15')).toBe('2026-10-28');
    // 2026-11 の水曜: 4, 11, 18, 25 → 第 2=11。
    expect(next(rule, '2026-10-28', '2026-10-29')).toBe('2026-11-11');
  });

  it('nths: [5] だけの指定は第 5 週のある月まで飛ぶ', () => {
    // 2026-11 の水曜は 4,11,18,25 の 4 回だけ（第 5 週なし）→ 12 月へ。
    // 2026-12 の水曜: 2, 9, 16, 23, 30 → 第 5=30。
    expect(
      next(
        { kind: 'nthWeek', nths: [5], weekday: 3 },
        '2026-11-11',
        '2026-11-12'
      )
    ).toBe('2026-12-30');
  });

  it("'last' は月の最後の該当曜日", () => {
    // 2026-11 の水曜の最後は 25。
    expect(
      next(
        { kind: 'nthWeek', nths: ['last'], weekday: 3 },
        '2026-11-01',
        '2026-11-01'
      )
    ).toBe('2026-11-25');
  });

  it("5 と 'last' が同じ日を指す月でも重複しない（第 5 週がある月）", () => {
    // 2026-12 の水曜は 2,9,16,23,30 → 第 5 = last = 30。候補が 1 つに畳まれる。
    const rule: ReminderRule = {
      kind: 'nthWeek',
      nths: [5, 'last'],
      weekday: 3
    };
    expect(next(rule, '2026-12-23', '2026-12-24')).toBe('2026-12-30');
    // 次は翌月（2027-01 の水曜: 6,13,20,27 → last=27）。
    expect(next(rule, '2026-12-30', '2026-12-31')).toBe('2027-01-27');
  });
});

describe('calcNextReminderDate: year', () => {
  it('翌年の同じ月日', () => {
    expect(
      next({ kind: 'year', month: 3, day: 15 }, '2026-03-15', '2026-09-25')
    ).toBe('2027-03-15');
  });

  it('2/29 指定は平年に 2/28 へ落ちる', () => {
    expect(
      next({ kind: 'year', month: 2, day: 29 }, '2024-02-29', '2024-03-01')
    ).toBe('2025-02-28');
  });
});

describe('calcNextReminderDate: 共通', () => {
  it('長期放置しても today を超えるまで進む', () => {
    // 2 年前の毎月 15 日。today を超える最初の日まで進む。
    expect(next({ kind: 'month', interval: 1, day: 15 }, '2024-05-15')).toBe(
      '2026-10-15'
    );
  });

  it('毎週でも長期放置から today を超える', () => {
    // 2026-09-25 は金曜。1 年前の金曜から毎週進めて today 超えの最初の金曜。
    expect(next({ kind: 'week', interval: 1, weekday: 5 }, '2025-09-26')).toBe(
      '2026-10-02'
    );
  });

  it('rule が壊れている（パース失敗）場合は null', () => {
    expect(next(null as unknown as ReminderRule, '2026-01-01')).toBeNull();
  });
});

describe('parseReminderRule', () => {
  it('正しい rule を通す', () => {
    expect(parseReminderRule({ kind: 'monthEnd', interval: 2 })).toEqual({
      kind: 'monthEnd',
      interval: 2
    });
  });

  it('nths を昇順・一意に正規化し last を末尾に置く', () => {
    expect(
      parseReminderRule({
        kind: 'nthWeek',
        nths: ['last', 4, 2, 2],
        weekday: 3
      })
    ).toEqual({ kind: 'nthWeek', nths: [2, 4, 'last'], weekday: 3 });
  });

  it('nths が空なら不正', () => {
    expect(
      parseReminderRule({ kind: 'nthWeek', nths: [], weekday: 3 })
    ).toBeNull();
  });

  it('未知の kind・壊れた値は null', () => {
    expect(parseReminderRule({ kind: 'daily' })).toBeNull();
    expect(parseReminderRule({})).toBeNull();
    expect(parseReminderRule(null)).toBeNull();
    expect(parseReminderRule({ kind: 'month', interval: 1 })).toBeNull();
  });
});
