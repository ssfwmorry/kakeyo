import { describe, expect, it } from 'vitest';
import { nextAllRecordsOrder, selectAllRecordDays } from './all-records';

// biome-ignore lint/suspicious/noExplicitAny: テスト用の最小 record ダミー
const rec = (id: number) => ({ id }) as any;

const days = [
  { dateStr: '2026-08-31', records: [rec(1)] }, // 前月（除外対象）
  { dateStr: '2026-09-01', records: [rec(2)] },
  { dateStr: '2026-09-05', records: [] }, // 記録なし（除外対象）
  { dateStr: '2026-09-10', records: [rec(3), rec(4)] },
  { dateStr: '2026-10-01', records: [rec(5)] } // 翌月（除外対象）
];

describe('selectAllRecordDays', () => {
  it('当月かつ記録のある日だけを残す（前後の月・空の日を除外）', () => {
    const result = selectAllRecordDays(days, '2026-09', 'asc');
    expect(result.map((d) => d.dateStr)).toEqual(['2026-09-01', '2026-09-10']);
  });

  it('昇順', () => {
    const result = selectAllRecordDays(days, '2026-09', 'asc');
    expect(result.map((d) => d.dateStr)).toEqual(['2026-09-01', '2026-09-10']);
  });

  it('降順', () => {
    const result = selectAllRecordDays(days, '2026-09', 'desc');
    expect(result.map((d) => d.dateStr)).toEqual(['2026-09-10', '2026-09-01']);
  });
});

describe('nextAllRecordsOrder', () => {
  it('null→desc、desc→asc、asc→desc の交互', () => {
    expect(nextAllRecordsOrder(null)).toBe('desc');
    expect(nextAllRecordsOrder('desc')).toBe('asc');
    expect(nextAllRecordsOrder('asc')).toBe('desc');
  });
});
