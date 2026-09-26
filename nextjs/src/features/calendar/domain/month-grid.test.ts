import { describe, expect, it } from 'vitest';
import { buildMonthGrid } from './month-grid';

describe('buildMonthGrid', () => {
  it('日曜始まりで、先頭を前月から詰める', () => {
    // 2026-09-01 は火曜。日・月の 2 マスが 8 月から入る。
    const cells = buildMonthGrid('2026-09');
    expect(cells[0]).toEqual({
      dateStr: '2026-08-30',
      day: 30,
      isCurrentMonth: false,
      weekday: 0
    });
    expect(cells[2]).toMatchObject({
      dateStr: '2026-09-01',
      isCurrentMonth: true
    });
  });

  it('7 の倍数で返す', () => {
    expect(buildMonthGrid('2026-09').length % 7).toBe(0);
    expect(buildMonthGrid('2026-02').length % 7).toBe(0);
  });

  it('月の日数ぶんだけ isCurrentMonth が立つ', () => {
    const inMonth = buildMonthGrid('2026-09').filter((c) => c.isCurrentMonth);
    expect(inMonth.length).toBe(30);
  });

  it('うるう年の 2 月も日数が合う', () => {
    const inMonth = buildMonthGrid('2024-02').filter((c) => c.isCurrentMonth);
    expect(inMonth.length).toBe(29);
  });

  it('週数は月によって変わる（固定 35 マスにしない）', () => {
    // 2026-08 は土曜始まりの 31 日で 6 週に渡る。
    expect(buildMonthGrid('2026-08').length).toBe(42);
  });
});
