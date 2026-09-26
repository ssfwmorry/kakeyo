import { describe, expect, it } from 'vitest';
import { nextPlannedRecordDate } from './next-record-date';

describe('nextPlannedRecordDate', () => {
  it('今日より後の日は今月', () => {
    expect(nextPlannedRecordDate('2026-09-10', 25)).toBe('2026-09-25');
  });

  it('今日と同じ日と今日より前の日は翌月', () => {
    expect(nextPlannedRecordDate('2026-09-25', 25)).toBe('2026-10-25');
    expect(nextPlannedRecordDate('2026-09-25', 10)).toBe('2026-10-10');
  });

  it('年をまたぐ', () => {
    expect(nextPlannedRecordDate('2026-12-20', 1)).toBe('2027-01-01');
  });
});
