import { describe, expect, it } from 'vitest';
import {
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
