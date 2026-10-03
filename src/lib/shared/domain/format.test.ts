import { describe, expect, it } from 'vitest';
import {
  amountToneClass,
  diffToneClass,
  formatMonthDayWeekJa,
  formatPrice,
  formatSlashDate,
  formatSlashDateWeekJa,
  formatSlashMonthDay,
  formatYearMonthJa,
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
  it('today を渡すと今年以外にだけ年を付ける', () => {
    expect(formatSlashMonthDay('2026-09-05', { today: '2026-09-25' })).toBe(
      '9/5'
    );
    expect(formatSlashMonthDay('2025-12-31', { today: '2026-09-25' })).toBe(
      '2025/12/31'
    );
  });
});

describe('formatYearMonthJa', () => {
  it('先頭 0 を落とす', () => {
    expect(formatYearMonthJa('2026-09')).toBe('2026年9月');
    expect(formatYearMonthJa('2026-12')).toBe('2026年12月');
  });
});

describe('formatPrice', () => {
  it('符号を付けず桁区切りで出す', () => {
    expect(formatPrice(2480)).toBe('2,480');
    expect(formatPrice(-320000)).toBe('320,000');
    expect(formatPrice(0)).toBe('0');
  });
});

describe('amountToneClass', () => {
  it('支出は本文色、収入はアクセント', () => {
    expect(amountToneClass(true)).toBe('text-foreground');
    expect(amountToneClass(false)).toBe('text-primary');
  });
});

describe('diffToneClass', () => {
  it('増えたときだけアクセントを当て、0 と減少は本文色', () => {
    expect(diffToneClass(1200)).toBe('text-primary');
    expect(diffToneClass(0)).toBe('text-foreground');
    expect(diffToneClass(-1200)).toBe('text-foreground');
  });
});

describe('quoted', () => {
  it('かぎかっこで囲む', () => {
    expect(quoted('通院')).toBe('「通院」');
  });
});
