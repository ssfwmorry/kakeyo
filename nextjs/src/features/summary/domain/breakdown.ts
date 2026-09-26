import type { PieListRow } from '@/features/summary/domain/chart-data';

// 内訳（カテゴリ別）の一覧行とドーナツの弧を、集計結果から導く純粋関数。
// 割合は小数 1 桁に丸め、弧は原典 Summary の描き方（半径 70・弧の間に 2px の隙間・
// 累積分だけ offset を負に送る）に合わせる。

export const DONUT_RADIUS = 70;
const CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS;
// 弧と弧の隙間（px）。
const ARC_GAP = 2;

export type BreakdownRow = {
  // 精算（type 未設定）は -1。
  id: number;
  name: string;
  colorName: string;
  value: number;
  // 全体に対する割合（%・小数 1 桁）。
  pct: number;
  pctText: string;
};

export type DonutArc = {
  key: string;
  colorName: string;
  // stroke-dasharray の描く長さ。
  length: number;
  // stroke-dashoffset。先頭は 0、以降は手前までの累積を負で持つ。
  offset: number;
};

export type Breakdown = {
  total: number;
  rows: BreakdownRow[];
  arcs: DonutArc[];
};

function rowKey(row: Pick<PieListRow, 'id' | 'name'>): string {
  return `${row.id}-${row.name}`;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

// 金額の大きい順に並べ、割合と弧を付ける。total が 0 のときは行も弧も空。
export function buildBreakdown(list: PieListRow[]): Breakdown {
  const sorted = [...list].sort((a, b) => b.value - a.value);
  const total = sorted.reduce((sum, row) => sum + row.value, 0);
  if (total <= 0) {
    return { total: 0, rows: [], arcs: [] };
  }

  const rows: BreakdownRow[] = sorted.map((row) => {
    const pct = Math.round((row.value / total) * 1000) / 10;
    return {
      id: row.id,
      name: row.name,
      colorName: row.colorName,
      value: row.value,
      pct,
      pctText: `${pct.toFixed(1)}%`
    };
  });

  let cumulative = 0;
  const arcs: DonutArc[] = sorted.map((row) => {
    const span = (row.value / total) * CIRCUMFERENCE;
    const arc = {
      key: rowKey(row),
      colorName: row.colorName,
      length: round2(Math.max(span - ARC_GAP, 0)),
      // 先頭は -0 ではなく 0 にする（描画には効かないが値として揃える）。
      offset: cumulative === 0 ? 0 : round2(-cumulative)
    };
    cumulative += span;
    return arc;
  });

  return { total, rows, arcs };
}
