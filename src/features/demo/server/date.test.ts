import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getDemoReferenceDate, getDemoReferenceYearMonth } from './date';

describe('demo reference date', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('固定スコープのデモは 2026-09 を使う', () => {
    vi.setSystemTime(new Date('2027-02-14T06:00:00Z'));

    expect(getDemoReferenceDate({ isDemo: true })).toBe('2026-09-25');
    expect(getDemoReferenceYearMonth({ isDemo: true })).toBe('2026-09');
  });

  it('通常ユーザは実際の現在日時を使う', () => {
    vi.setSystemTime(new Date('2027-02-14T06:00:00Z'));

    expect(getDemoReferenceDate({ isDemo: false })).toBe('2027-02-14');
    expect(getDemoReferenceYearMonth({ isDemo: false })).toBe('2027-02');
  });
});
