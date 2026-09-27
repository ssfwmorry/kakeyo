import { describe, expect, it } from 'vitest';
import type {
  PieListRow,
  PieListSubRow
} from '@/features/summary/domain/chart-data';
import { buildBreakdown } from './breakdown';

function row(
  id: number,
  name: string,
  value: number,
  colorName = 'blue',
  extra: Partial<PieListRow> = {}
): PieListRow {
  return {
    id,
    name,
    value,
    colorName,
    isPair: false,
    pairUserName: null,
    subs: [],
    ...extra
  };
}

function sub(id: number, name: string, value: number): PieListSubRow {
  return { id, name, value };
}

describe('buildBreakdown', () => {
  it('金額の大きい順に並べ、割合を小数 1 桁で出す', () => {
    const result = buildBreakdown([
      row(1, '交通', 19850),
      row(2, '食費', 63500),
      row(3, '住居', 55000)
    ]);
    expect(result.total).toBe(138350);
    expect(result.rows.map((r) => r.name)).toEqual(['食費', '住居', '交通']);
    expect(result.rows[0].pct).toBe(45.9);
    expect(result.rows[0].pctText).toBe('45.9%');
  });

  it('弧は隙間 2px を引いた長さで、offset は手前までの累積の負', () => {
    const result = buildBreakdown([row(1, 'a', 3), row(2, 'b', 1)]);
    const circumference = 2 * Math.PI * 70;
    expect(result.arcs[0].length).toBeCloseTo(circumference * 0.75 - 2, 2);
    expect(result.arcs[0].offset).toBe(0);
    expect(result.arcs[1].length).toBeCloseTo(circumference * 0.25 - 2, 2);
    expect(result.arcs[1].offset).toBeCloseTo(-circumference * 0.75, 2);
  });

  it('ごく小さい割合でも弧の長さは負にならない', () => {
    const result = buildBreakdown([row(1, 'a', 100000), row(2, 'b', 1)]);
    expect(result.arcs[1].length).toBe(0);
  });

  it('合計 0 なら行も弧も空', () => {
    expect(buildBreakdown([])).toEqual({ total: 0, rows: [], arcs: [] });
  });

  it('精算行（id=-1）もそのまま並び、isSettlement が立つ', () => {
    const result = buildBreakdown([
      row(1, '食費', 100),
      row(-1, '精算', 300, 'yellow')
    ]);
    expect(result.rows[0]).toMatchObject({
      id: -1,
      name: '精算',
      pct: 75,
      isSettlement: true
    });
    expect(result.rows[1].isSettlement).toBe(false);
    expect(result.arcs[0].key).toBe('-1-精算');
  });

  it('サブカテゴリは金額降順で、割合は親比ではなく全体比', () => {
    const result = buildBreakdown([
      row(1, '食費', 600, 'orange', {
        subs: [sub(11, 'コンビニ', 100), sub(12, 'スーパー', 500)]
      }),
      row(2, '住居', 400)
    ]);
    const subs = result.rows[0].subs;
    expect(subs.map((s) => s.name)).toEqual(['スーパー', 'コンビニ']);
    // 全体 1000 に対する 500 / 100。親（600）比なら 83.3% / 16.7% になる。
    expect(subs[0].pctText).toBe('50.0%');
    expect(subs[1].pctText).toBe('10.0%');
  });

  it('サブカテゴリの付いていない残りを「サブカテゴリなし」として末尾に出す', () => {
    const result = buildBreakdown([
      row(1, '食費', 1000, 'orange', { subs: [sub(11, 'スーパー', 700)] })
    ]);
    const subs = result.rows[0].subs;
    expect(subs.map((s) => [s.name, s.value])).toEqual([
      ['スーパー', 700],
      ['サブカテゴリなし', 300]
    ]);
    expect(subs[1].id).toBeNull();
  });

  it('サブカテゴリで埋まっていれば「サブカテゴリなし」は出さない', () => {
    const result = buildBreakdown([
      row(1, '食費', 1000, 'orange', { subs: [sub(11, 'スーパー', 1000)] })
    ]);
    expect(result.rows[0].subs).toHaveLength(1);
  });

  it('サブカテゴリを持たないカテゴリには子行を出さない', () => {
    const result = buildBreakdown([row(1, '住居', 1000)]);
    expect(result.rows[0].subs).toEqual([]);
  });

  it('共有と立替のユーザ名を行に持つ', () => {
    const result = buildBreakdown([
      row(1, 'クレカ', 100, 'blue', { isPair: true, pairUserName: 'ゆか' })
    ]);
    expect(result.rows[0]).toMatchObject({
      isPair: true,
      pairUserName: 'ゆか'
    });
  });
});
