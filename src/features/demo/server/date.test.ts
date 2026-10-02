import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getDemoReferenceDate,
  getDemoReferenceYearMonth,
  getDemoTodayOverride
} from './date';

// connection() は Next のリクエストスコープ外では投げるため、即時解決に差し替える。
vi.mock('next/server', () => ({ connection: () => Promise.resolve() }));

describe('demo reference date', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('固定スコープのデモは 2026-09 を使う', async () => {
    vi.setSystemTime(new Date('2027-02-14T06:00:00Z'));

    expect(await getDemoReferenceDate({ isDemo: true })).toBe('2026-09-25');
    expect(await getDemoReferenceYearMonth({ isDemo: true })).toBe('2026-09');
    expect(getDemoTodayOverride({ isDemo: true })).toBe('2026-09-25');
  });

  it('通常ユーザは実際の現在日時を使う', async () => {
    vi.setSystemTime(new Date('2027-02-14T06:00:00Z'));

    expect(await getDemoReferenceDate({ isDemo: false })).toBe('2027-02-14');
    expect(await getDemoReferenceYearMonth({ isDemo: false })).toBe('2027-02');
    expect(getDemoTodayOverride({ isDemo: false })).toBeNull();
  });
});
