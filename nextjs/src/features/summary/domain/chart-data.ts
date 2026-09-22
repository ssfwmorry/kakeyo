import type {
  MethodSummaryItem,
  PayAndIncomeItem,
  SubTypeSummaryRow,
  TypeSummaryItem,
  TypeSummaryPeriodRow
} from '../types';

// summary 各グラフのデータ整形（純粋関数・FE/BE 両用 = Vitest 対象）。
// 旧 Nuxt の Chart.js 用 convertShowData を Recharts の「行オブジェクト配列」形式へ移す。
// Recharts は data=[{x, seriesKey: value, ...}] の行配列 + <Pie/Bar dataKey> で描くため、
// 系列（凡例）情報は別途 series メタとして返す。

// 円グラフ（内訳）

// 円グラフ 1 スライス（Recharts Pie の data 要素）。fill は行に持たせる（Cell 相当）。
export type PieSlice = {
  // 系列名（カテゴリ名 / 方法名）。
  name: string;
  // 金額（負値もありうるが円は絶対量で描くため呼び出し側で符号は扱わない前提）。
  value: number;
  // hex 色。
  fill: string;
};

// 内訳一覧の 1 行（テーブル + 「＞」遷移用）。
export type PieListRow = {
  id: number;
  name: string;
  // 金額（表示整形前の生値）。フォーマットは表示側で toShowStr を通す。
  value: number;
  // Vuetify 色トークン名（アバター/文字色用。hex ではない = 旧 FE の list と同じ）。
  colorName: string;
  isPair: boolean;
  pairUserName: string | null;
  subs: PieListSubRow[];
};

export type PieListSubRow = {
  id: number;
  name: string;
  value: number;
};

export type PieShowData = {
  slices: PieSlice[];
  list: PieListRow[];
};

// カテゴリ別（TypeSummaryItem[]）→ 円 + 一覧。sum===0 は落とす（旧 FE 踏襲）。
// typeId=null（精算）は id=null のため一覧の「＞」を出さないが行自体は表示する。
export function buildTypePie(
  items: TypeSummaryItem[],
  toHex: (name: string | null) => string,
  settlementColorName: string,
  settlementName: string
): PieShowData {
  const slices: PieSlice[] = [];
  const list: PieListRow[] = [];

  for (const item of items) {
    if (item.sum === 0) {
      continue;
    }
    const name = item.typeName ?? settlementName;
    // 一覧はトークン名（精算は yellow）、円は hex。
    const colorName = item.colorName ?? settlementColorName;
    slices.push({ name, value: item.sum, fill: toHex(item.colorName) });
    list.push({
      // typeId=null（精算）は id=-1 にして、呼び出し側が id<0 で「＞」（records への
      // 遷移）不可を判定できるようにする。通常カテゴリは typeId をそのまま採用。
      id: item.typeId ?? -1,
      name,
      value: item.sum,
      colorName,
      isPair: item.isPair,
      pairUserName: null,
      subs: item.subTypes.map((sub) => ({
        id: sub.subTypeId,
        name: sub.subTypeName,
        value: sub.subTypeSum
      }))
    });
  }

  return { slices, list };
}

// 方法別（MethodSummaryItem[]）→ 円 + 一覧。sum===0 は落とす。
export function buildMethodPie(
  items: MethodSummaryItem[],
  toHex: (name: string | null) => string
): PieShowData {
  const slices: PieSlice[] = [];
  const list: PieListRow[] = [];

  for (const item of items) {
    if (item.sum === 0) {
      continue;
    }
    slices.push({
      name: item.methodName,
      value: item.sum,
      fill: toHex(item.colorName)
    });
    list.push({
      id: item.methodId,
      name: item.methodName,
      value: item.sum,
      colorName: item.colorName,
      isPair: item.isPair,
      pairUserName: item.pairUserName,
      subs: []
    });
  }

  return { slices, list };
}

// 棒グラフ（推移 > 全体）

// 12 ヶ月分の 1 行（Recharts Bar の data 要素）。x=月ラベル、pay=支出、payAndIncome=収支。
export type PayIncomeBarRow = {
  month: string;
  pay: number;
  // 収支（収入 - 支出）。
  payAndIncome: number;
  // テーブル表示用の生値。
  income: number;
};

export type PayIncomeShowData = {
  rows: PayIncomeBarRow[];
  // 支出合計（正の生値）。
  sumPay: number;
  // 収支合計（収入 - 支出 の総和）。
  sumPayAndIncome: number;
};

const MONTH_KEYS = [
  '01',
  '02',
  '03',
  '04',
  '05',
  '06',
  '07',
  '08',
  '09',
  '10',
  '11',
  '12'
] as const;

// 先頭ゼロを落とす（'08'→'8'）。旧 ConvertSuppressZero。
function suppressZero(month: string): string {
  return month.replace(/^0+/, '');
}

// 年の PayAndIncomeItem[]（登録のある月のみ）→ 12 ヶ月に整形（欠損月は 0）。
// 収支は income - pay。合計は総和。
export function buildPayIncomeBar(
  items: PayAndIncomeItem[],
  year: number
): PayIncomeShowData {
  const byMonth = new Map<string, PayAndIncomeItem>();
  for (const item of items) {
    byMonth.set(item.yearMonth, item);
  }

  const rows: PayIncomeBarRow[] = [];
  let sumPay = 0;
  let sumPayAndIncome = 0;

  for (const key of MONTH_KEYS) {
    const yearMonth = `${year}-${key}`;
    const found = byMonth.get(yearMonth);
    if (!found) {
      rows.push({
        month: suppressZero(key),
        pay: 0,
        income: 0,
        payAndIncome: 0
      });
      continue;
    }
    const payAndIncome = found.incomeSum - found.paySum;
    sumPay += found.paySum;
    sumPayAndIncome += payAndIncome;
    rows.push({
      month: suppressZero(key),
      pay: found.paySum,
      income: found.incomeSum,
      payAndIncome
    });
  }

  return { rows, sumPay, sumPayAndIncome };
}

// 積み上げ棒（推移 > カテゴリ別・「全て」= カテゴリ別）

// 系列メタ（凡例・色・Bar dataKey）。key は type/sub_type の id を文字列化したもの。
export type StackSeries = {
  key: string;
  label: string;
  // hex 色（type は color_classifications 由来、sub_type は循環パレット）。
  color: string;
};

// 積み上げ棒の 1 行（Recharts Bar の data 要素）。x=月ラベル、各系列 key に金額。
export type StackBarRow = {
  month: string;
  [seriesKey: string]: number | string;
};

export type StackShowData = {
  rows: StackBarRow[];
  series: StackSeries[];
};

// TypeSummaryPeriodRow[]（月 × カテゴリ）→ 積み上げ棒。
// 系列はカテゴリ（typeId。null=精算）。12 ヶ月に整形し、欠損は 0。
export function buildTypePeriodStack(
  periodRows: TypeSummaryPeriodRow[],
  year: number,
  toHex: (name: string | null) => string,
  settlementName: string
): StackShowData {
  // 系列（typeId）の出現順を保持しつつ重複排除。
  const seriesByKey = new Map<string, StackSeries>();
  // month(YYYY-MM) → { seriesKey → sum }
  const valuesByMonth = new Map<string, Map<string, number>>();

  for (const row of periodRows) {
    const key = String(row.typeId);
    if (!seriesByKey.has(key)) {
      seriesByKey.set(key, {
        key,
        label: row.typeName ?? settlementName,
        color: toHex(row.typeColorClassificationName)
      });
    }
    let monthMap = valuesByMonth.get(row.yearMonth);
    if (!monthMap) {
      monthMap = new Map<string, number>();
      valuesByMonth.set(row.yearMonth, monthMap);
    }
    monthMap.set(key, (monthMap.get(key) ?? 0) + row.sum);
  }

  const series = [...seriesByKey.values()];
  const rows = buildStackRows(series, valuesByMonth, year);
  return { rows, series };
}

// SubTypeSummaryRow[]（月 × サブカテゴリ）→ 積み上げ棒。
// 系列はサブカテゴリ（subTypeId。null=「サブカテゴリなし」）。色は循環パレット、
// 「なし」はグレー。12 ヶ月に整形し、欠損は 0。
export function buildSubTypeStack(
  subRows: SubTypeSummaryRow[],
  year: number,
  subTypeName: (subTypeId: number | null) => string,
  paletteColor: (index: number) => string,
  noSubTypeColor: string,
  noSubTypeLabel: string
): StackShowData {
  // 「なし」を先頭系列に固定するため、まず null を登録する。
  const seriesByKey = new Map<string, StackSeries>();
  const valuesByMonth = new Map<string, Map<string, number>>();
  let paletteIndex = 0;

  const NULL_KEY = 'null';

  for (const row of subRows) {
    const key = String(row.subTypeId);
    if (!seriesByKey.has(key)) {
      if (key === NULL_KEY) {
        seriesByKey.set(key, {
          key,
          label: noSubTypeLabel,
          color: noSubTypeColor
        });
      } else {
        seriesByKey.set(key, {
          key,
          label: subTypeName(row.subTypeId),
          color: paletteColor(paletteIndex)
        });
        paletteIndex += 1;
      }
    }
    let monthMap = valuesByMonth.get(row.yearMonth);
    if (!monthMap) {
      monthMap = new Map<string, number>();
      valuesByMonth.set(row.yearMonth, monthMap);
    }
    monthMap.set(key, (monthMap.get(key) ?? 0) + row.sum);
  }

  // 「なし」を先頭に寄せる（旧 FE は「サブカテゴリなし」を最初の dataset にする）。
  const series = [...seriesByKey.values()].sort((a, b) => {
    if (a.key === NULL_KEY) {
      return -1;
    }
    if (b.key === NULL_KEY) {
      return 1;
    }
    return 0;
  });

  const rows = buildStackRows(series, valuesByMonth, year);
  return { rows, series };
}

// 系列 × 月マップ → 12 ヶ月の行配列（欠損 0）。積み上げ棒 2 種で共通。
function buildStackRows(
  series: StackSeries[],
  valuesByMonth: Map<string, Map<string, number>>,
  year: number
): StackBarRow[] {
  return MONTH_KEYS.map((key) => {
    const yearMonth = `${year}-${key}`;
    const monthMap = valuesByMonth.get(yearMonth);
    const row: StackBarRow = { month: suppressZero(key) };
    for (const s of series) {
      row[s.key] = monthMap?.get(s.key) ?? 0;
    }
    return row;
  });
}
