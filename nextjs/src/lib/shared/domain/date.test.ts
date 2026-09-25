import { describe, expect, it } from 'vitest';
import {
  addDaysJst,
  dateInMonthJst,
  diffDaysJst,
  endOfDayJst,
  formatDateLabelJst,
  formatDateWithWeekdayJst,
  formatMonthDayJst,
  listDatesJst,
  startOfDayJst,
  startOfMonthJst,
  startOfNextMonthJst,
  toDateStringJst,
  toYearMonthJst
} from './date';

describe('toDateStringJst', () => {
  it('UTC の日時を JST の暦日に丸める（日跨ぎ）', () => {
    // 2024-01-01T15:00:00Z = 2024-01-02 00:00 JST → JST では翌日
    expect(toDateStringJst('2024-01-01T15:00:00Z')).toBe('2024-01-02');
  });

  it('UTC 同日でも JST 深夜手前は同日', () => {
    // 2024-01-01T14:59:59Z = 2024-01-01 23:59:59 JST
    expect(toDateStringJst('2024-01-01T14:59:59Z')).toBe('2024-01-01');
  });
});

describe('toYearMonthJst', () => {
  it('月跨ぎを JST 基準で判定する', () => {
    // 2024-01-31T15:00:00Z = 2024-02-01 00:00 JST → 2月
    expect(toYearMonthJst('2024-01-31T15:00:00Z')).toBe('2024-02');
  });
});

describe('startOfDayJst', () => {
  it('JST の暦日 0:00 は UTC では前日 15:00', () => {
    // 2024-03-10 00:00 JST = 2024-03-09T15:00:00Z
    expect(startOfDayJst('2024-03-10').toISOString()).toBe(
      '2024-03-09T15:00:00.000Z'
    );
  });
});

describe('startOfMonthJst / startOfNextMonthJst', () => {
  it('月初と翌月初が JST 0:00 起点で UTC 前日 15:00 になる', () => {
    // 2024-02 月初 = 2024-02-01 00:00 JST = 2024-01-31T15:00:00Z
    expect(startOfMonthJst('2024-02').toISOString()).toBe(
      '2024-01-31T15:00:00.000Z'
    );
    // 2024-02 の翌月初 = 2024-03-01 00:00 JST = 2024-02-29T15:00:00Z（うるう年）
    expect(startOfNextMonthJst('2024-02').toISOString()).toBe(
      '2024-02-29T15:00:00.000Z'
    );
  });

  it('12月の翌月初は翌年1月になる', () => {
    // 2024-12 の翌月初 = 2025-01-01 00:00 JST = 2024-12-31T15:00:00Z
    expect(startOfNextMonthJst('2024-12').toISOString()).toBe(
      '2024-12-31T15:00:00.000Z'
    );
  });
});

describe('endOfDayJst', () => {
  it('その日の JST 23:59:59.999 を UTC の Date にする', () => {
    // 2024-01-15 の JST 終端 = 2024-01-15T23:59:59.999 JST = 2024-01-15T14:59:59.999Z
    expect(endOfDayJst('2024-01-15').toISOString()).toBe(
      '2024-01-15T14:59:59.999Z'
    );
  });
});

// 月末最終秒のレコードが月次範囲（gte startOfMonth .. lt startOfNextMonth）に
// 取りこぼされないことを、境界の Date 比較で明示的に保証する。
describe('月次範囲の境界包含（gte..lt）', () => {
  it('月末 JST 23:59:59.999 のレコードは当月範囲に含まれ、翌月範囲には含まれない', () => {
    // 2024-02（うるう年）の月末最終ミリ秒 = 2024-02-29 23:59:59.999 JST = 2024-02-29T14:59:59.999Z
    const monthEnd = endOfDayJst('2024-02-29');
    const start = startOfMonthJst('2024-02');
    const nextStart = startOfNextMonthJst('2024-02');

    // 当月範囲 [start, nextStart) に月末最終秒が含まれる（gte かつ lt）。
    expect(monthEnd.getTime()).toBeGreaterThanOrEqual(start.getTime());
    expect(monthEnd.getTime()).toBeLessThan(nextStart.getTime());

    // 翌月の下限（= 当月の上限）は当月末最終秒より後（1ms 差で取りこぼさない）。
    expect(nextStart.getTime() - monthEnd.getTime()).toBe(1);
  });

  it('翌月初 JST 0:00 ちょうどのレコードは当月に含まれず翌月に含まれる（半開区間の境界）', () => {
    // 2024-03-01 00:00 JST = 2024-02-29T15:00:00Z（= startOfNextMonthJst('2024-02')）
    const nextMonthStart = startOfMonthJst('2024-03');
    const febNextStart = startOfNextMonthJst('2024-02');
    // 当月上限（lt）に一致するため当月には含まれない一方、翌月の下限（gte）に一致して含まれる。
    expect(nextMonthStart.getTime()).toBe(febNextStart.getTime());
  });
});

describe('dateInMonthJst', () => {
  it('前月の指定日を YYYY-MM-DD で返す（カレンダー範囲の下限）', () => {
    // 2024-03 の前月(2月)21日
    expect(dateInMonthJst('2024-03', -1, 21)).toBe('2024-02-21');
  });

  it('翌月の指定日を YYYY-MM-DD で返す（カレンダー範囲の上限）', () => {
    // 2024-03 の翌月(4月)9日
    expect(dateInMonthJst('2024-03', 1, 9)).toBe('2024-04-09');
  });

  it('年をまたぐ（1月の前月は前年12月）', () => {
    expect(dateInMonthJst('2024-01', -1, 21)).toBe('2023-12-21');
  });
});

describe('formatDateLabelJst', () => {
  it('YYYY-MM-DD を M月D日 に整形する', () => {
    expect(formatDateLabelJst('2024-03-09')).toBe('3月9日');
  });

  it('ゼロ埋めを落として 1 桁で出す（01→1）', () => {
    expect(formatDateLabelJst('2024-01-01')).toBe('1月1日');
  });

  it('2 桁の月日はそのまま出す', () => {
    expect(formatDateLabelJst('2024-12-31')).toBe('12月31日');
  });
});

describe('formatDateWithWeekdayJst', () => {
  it('M月D日(曜) に整形する', () => {
    // 2026-09-23 は水曜日。
    expect(formatDateWithWeekdayJst('2026-09-23')).toBe('9月23日(水)');
    // 2026-01-04 は日曜日（ゼロ埋めを外す）。
    expect(formatDateWithWeekdayJst('2026-01-04')).toBe('1月4日(日)');
  });
});

describe('listDatesJst', () => {
  it('両端を含む暦日を昇順で列挙する（月跨ぎ）', () => {
    expect(listDatesJst('2026-08-30', '2026-09-02')).toEqual([
      '2026-08-30',
      '2026-08-31',
      '2026-09-01',
      '2026-09-02'
    ]);
  });

  it('同日なら 1 件、逆順なら空', () => {
    expect(listDatesJst('2026-09-21', '2026-09-21')).toEqual(['2026-09-21']);
    expect(listDatesJst('2026-09-22', '2026-09-21')).toEqual([]);
  });
});

describe('addDaysJst', () => {
  it('負の日数で過去へ、月跨ぎも暦どおり', () => {
    expect(addDaysJst('2026-03-01', -1)).toBe('2026-02-28');
    expect(addDaysJst('2026-03-01', -2)).toBe('2026-02-27');
  });

  it('閏年の 2/29 を跨ぐ', () => {
    expect(addDaysJst('2024-02-28', 1)).toBe('2024-02-29');
    expect(addDaysJst('2024-03-01', -1)).toBe('2024-02-29');
  });
});

describe('formatMonthDayJst', () => {
  it('ゼロ埋めを外して M/D にする', () => {
    expect(formatMonthDayJst('2026-09-05')).toBe('9/5');
    expect(formatMonthDayJst('2026-12-25')).toBe('12/25');
  });
});

describe('diffDaysJst', () => {
  it('a − b を日数で返す（月跨ぎ・閏年）', () => {
    expect(diffDaysJst('2026-09-25', '2026-09-20')).toBe(5);
    expect(diffDaysJst('2026-09-25', '2026-08-31')).toBe(25);
    expect(diffDaysJst('2024-03-01', '2024-02-28')).toBe(2);
  });

  it('同日は 0、b が後なら負', () => {
    expect(diffDaysJst('2026-09-25', '2026-09-25')).toBe(0);
    expect(diffDaysJst('2026-09-20', '2026-09-25')).toBe(-5);
  });
});
