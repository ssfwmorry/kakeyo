import { describe, expect, it } from 'vitest';
import { relativeDayLabel } from './relative-day';

describe('relativeDayLabel', () => {
  const today = '2026-09-25';

  it('今日・昨日・おとといにラベルを付ける', () => {
    expect(relativeDayLabel('2026-09-25', today)).toBe('今日');
    expect(relativeDayLabel('2026-09-24', today)).toBe('昨日');
    expect(relativeDayLabel('2026-09-23', today)).toBe('おととい');
  });

  it('3 日以上前はラベルを出さない', () => {
    expect(relativeDayLabel('2026-09-22', today)).toBeNull();
    expect(relativeDayLabel('2026-08-25', today)).toBeNull();
  });

  it('未来の日はラベルを出さない', () => {
    expect(relativeDayLabel('2026-09-26', today)).toBeNull();
  });

  it('月をまたいでも日数で数える', () => {
    expect(relativeDayLabel('2026-09-30', '2026-10-01')).toBe('昨日');
    expect(relativeDayLabel('2026-09-29', '2026-10-01')).toBe('おととい');
  });
});
