import { describe, expect, it } from 'vitest';
import { formatLocalDate, parseLocalDate } from './local-date';

describe('parseLocalDate', () => {
  it('YYYY-MM-DD をローカル暦日の Date に変換する', () => {
    const d = parseLocalDate('2026-09-22');
    expect(d?.getFullYear()).toBe(2026);
    expect(d?.getMonth()).toBe(8); // 0-indexed
    expect(d?.getDate()).toBe(22);
  });

  it('不正・空文字は undefined', () => {
    expect(parseLocalDate('')).toBeUndefined();
    expect(parseLocalDate('2026-9-2')).toBeUndefined();
    expect(parseLocalDate('not-a-date')).toBeUndefined();
  });
});

describe('formatLocalDate', () => {
  it('ローカル暦日の Date を YYYY-MM-DD にする（0 埋め）', () => {
    expect(formatLocalDate(new Date(2026, 8, 22))).toBe('2026-09-22');
    expect(formatLocalDate(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('往復で一致する', () => {
    const s = '2027-12-31';
    const d = parseLocalDate(s);
    expect(d && formatLocalDate(d)).toBe(s);
  });
});
