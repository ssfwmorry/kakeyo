import { describe, expect, it } from 'vitest';
import { getHolidayName } from './holiday';

describe('getHolidayName', () => {
  it('元日（1/1）は「元日」を返す', () => {
    expect(getHolidayName('2026-01-01')).toBe('元日');
  });

  it('祝日でない平日は null を返す', () => {
    expect(getHolidayName('2026-01-05')).toBeNull();
  });

  it('空文字は null を返す', () => {
    expect(getHolidayName('')).toBeNull();
  });

  it('日付形式が不正なら null を返す', () => {
    expect(getHolidayName('not-a-date')).toBeNull();
  });

  it('振替休日も祝日名を返す（2026-05-06 憲法記念日の振替休日）', () => {
    // 2026-05-03（憲法記念日）が日曜のため 05-06 が振替休日。
    expect(getHolidayName('2026-05-06')).not.toBeNull();
  });
});
