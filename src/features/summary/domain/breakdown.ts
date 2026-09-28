import {
  type PieListRow,
  SETTLEMENT_ROW_ID
} from '@/features/summary/domain/chart-data';

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
  // 共有の行（名前の後ろに共有アイコンを出す）。
  isPair: boolean;
  // 方法軸で立替の行に出す、立て替えた人の名前。
  pairUserName: string | null;
  // 精算（type 未設定）の行。輪郭だけの丸で描き、明細へは進めない。
  isSettlement: boolean;
  subs: BreakdownSubRow[];
};

// サブカテゴリの子行。割合は親比ではなく全体に対する割合
// （原典 SumBreakdown の pctOf は total 基準）。
export type BreakdownSubRow = {
  // 「サブカテゴリなし」は実体が無いので null。
  id: number | null;
  name: string;
  value: number;
  pct: number;
  pctText: string;
};

// サブカテゴリが付いていない分をまとめる行の名前。
export const NO_SUB_TYPE_NAME = 'サブカテゴリなし';

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

// サブカテゴリの子行を作る。金額降順に並べ、サブカテゴリが付いていない残りが
// あれば「サブカテゴリなし」として末尾に足す（サービス層はサブカテゴリの付いた分
// しか返さないため、親との差がそのまま「なし」の分になる）。
// サブカテゴリを 1 つも持たないカテゴリには子行を出さない（親だけで足りる）。
function buildSubRows(
  row: PieListRow,
  pctOf: (value: number) => number
): BreakdownSubRow[] {
  if (row.subs.length === 0) {
    return [];
  }

  const toSubRow = (
    id: number | null,
    name: string,
    value: number
  ): BreakdownSubRow => {
    const pct = pctOf(value);
    return { id, name, value, pct, pctText: `${pct.toFixed(1)}%` };
  };

  const subs = [...row.subs]
    .sort((a, b) => b.value - a.value)
    .map((sub) => toSubRow(sub.id, sub.name, sub.value));

  const assigned = subs.reduce((sum, sub) => sum + sub.value, 0);
  const rest = row.value - assigned;
  if (rest > 0) {
    subs.push(toSubRow(null, NO_SUB_TYPE_NAME, rest));
  }
  return subs;
}

// 金額の大きい順に並べ、割合と弧を付ける。total が 0 のときは行も弧も空。
export function buildBreakdown(list: PieListRow[]): Breakdown {
  const sorted = [...list].sort((a, b) => b.value - a.value);
  const total = sorted.reduce((sum, row) => sum + row.value, 0);
  if (total <= 0) {
    return { total: 0, rows: [], arcs: [] };
  }

  const pctOf = (value: number) => Math.round((value / total) * 1000) / 10;

  const rows: BreakdownRow[] = sorted.map((row) => {
    const pct = pctOf(row.value);
    return {
      id: row.id,
      name: row.name,
      colorName: row.colorName,
      value: row.value,
      pct,
      pctText: `${pct.toFixed(1)}%`,
      isPair: row.isPair,
      pairUserName: row.pairUserName,
      isSettlement: row.id === SETTLEMENT_ROW_ID,
      subs: buildSubRows(row, pctOf)
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
