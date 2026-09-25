import { describe, expect, it } from 'vitest';
import { buildDateChips, withSelectedChip } from './date-chips';

describe('buildDateChips', () => {
  it('今日を起点に 3 日分を並べ、今日だけ M/D を添える', () => {
    expect(buildDateChips('2026-09-25')).toEqual([
      { date: '2026-09-25', label: '今日 9/25' },
      { date: '2026-09-24', label: '昨日' },
      { date: '2026-09-23', label: 'おととい' }
    ]);
  });

  it('月初でも前月へ正しく遡る', () => {
    expect(buildDateChips('2026-10-01').map((chip) => chip.date)).toEqual([
      '2026-10-01',
      '2026-09-30',
      '2026-09-29'
    ]);
  });
});

describe('withSelectedChip', () => {
  const chips = buildDateChips('2026-09-25');

  it('3 択の中の日ならそのまま', () => {
    expect(withSelectedChip(chips, '2026-09-24')).toBe(chips);
  });

  it('3 択の外の日は M月D日 のチップを先頭に足す', () => {
    expect(withSelectedChip(chips, '2026-09-10')[0]).toEqual({
      date: '2026-09-10',
      label: '9月10日'
    });
    expect(withSelectedChip(chips, '2026-09-10')).toHaveLength(4);
  });
});
