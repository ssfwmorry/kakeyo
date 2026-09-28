import { describe, expect, it } from 'vitest';
import {
  formatMonthDayWeekJa,
  formatSignedPrice,
  formatSlashDate,
  formatSlashDateWeekJa,
  formatSlashMonthDay,
  quoted
} from './format';

describe('formatMonthDayWeekJa', () => {
  it('全角括弧の曜日付きで月日を出す', () => {
    expect(formatMonthDayWeekJa('2026-09-25')).toBe('9月25日（金）');
  });

  it('today を渡すと今年以外にだけ年を付ける', () => {
    expect(formatMonthDayWeekJa('2026-09-25', { today: '2026-09-25' })).toBe(
      '9月25日（金）'
    );
    expect(formatMonthDayWeekJa('2027-01-05', { today: '2026-09-25' })).toBe(
      '2027年1月5日（火）'
    );
  });
});

describe('formatSlashDateWeekJa', () => {
  it('今年なら年を付けない', () => {
    expect(formatSlashDateWeekJa('2026-09-21', { today: '2026-09-25' })).toBe(
      '9/21（月）'
    );
  });

  it('今年以外は年を前置する', () => {
    expect(formatSlashDateWeekJa('2027-01-05', { today: '2026-09-25' })).toBe(
      '2027年1/5（火）'
    );
  });

  it('withYear で年の有無を強制できる', () => {
    expect(
      formatSlashDateWeekJa('2027-01-05', {
        today: '2026-09-25',
        withYear: false
      })
    ).toBe('1/5（火）');
  });
});

describe('formatSlashDate / formatSlashMonthDay', () => {
  it('ゼロ埋めしない', () => {
    expect(formatSlashDate('2026-09-05')).toBe('2026/9/5');
    expect(formatSlashMonthDay('2026-09-05')).toBe('9/5');
  });
});

describe('formatSignedPrice', () => {
  it('支出は U+2212、収入は + を付ける', () => {
    expect(formatSignedPrice(2480, true)).toBe('−2,480');
    expect(formatSignedPrice(320000, false)).toBe('+320,000');
  });

  it('0 は符号を付けない', () => {
    expect(formatSignedPrice(0, true)).toBe('0');
  });
});

describe('quoted', () => {
  it('かぎかっこで囲む', () => {
    expect(quoted('通院')).toBe('「通院」');
  });
});
