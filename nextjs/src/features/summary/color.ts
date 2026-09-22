// 色名 → 実 CSS 色（hex）の対応（summary feature 内・純粋関数）。
// DB の color_classifications.name は Vuetify のマテリアル色名で保存される。
// bank/record にも同等の COLOR_HEX があるが、barrel が公開していない色関数を
// 他 feature の内部から直接 import するのは所有境界違反のため、summary は自前で持つ
// （旧 Nuxt の COLOR_CODE を踏襲。精算の 'yellow' を含む）。

const COLOR_HEX: Record<string, string> = {
  red: '#f44336',
  pink: '#e91e63',
  purple: '#9c27b0',
  'deep-purple': '#673ab7',
  indigo: '#3f51b5',
  blue: '#2196f3',
  'light-blue': '#03a9f4',
  cyan: '#00bcd4',
  teal: '#009688',
  green: '#4caf50',
  'light-green': '#8bc34a',
  lime: '#cddc39',
  amber: '#ffc107',
  orange: '#ff9800',
  brown: '#795548',
  'blue-grey': '#607d8b',
  grey: '#9e9e9e',
  black: '#000000',
  yellow: '#ffeb3b'
};

// 精算（type 未設定）の表示名・色。旧 SettlementRecord を踏襲。
export const SETTLEMENT_COLOR_NAME = 'yellow';
export const SETTLEMENT_NAME = '精算';

// 色名 → hex。未知の色名／null はグレーにフォールバックする。
export function colorHex(name: string | null): string {
  if (name === null) {
    return COLOR_HEX[SETTLEMENT_COLOR_NAME];
  }
  return COLOR_HEX[name] ?? '#9e9e9e';
}

// サブカテゴリ積み上げ棒用の固定色（旧 SummaryBarType の subTypeColors）。
// CSS 色名。type 別の色（color_classifications）とは別系統で、
// 1 カテゴリ内のサブカテゴリを見分けるための循環パレット。
export const SUB_TYPE_COLORS = [
  'gold',
  'mediumseagreen',
  'blueviolet',
  'lightpink',
  'royalblue',
  'chocolate'
] as const;

// 「サブカテゴリなし」系列の色（旧 colorGrey）。
export const NO_SUB_TYPE_COLOR = '#9e9e9e';

export function subTypeColor(index: number): string {
  return SUB_TYPE_COLORS[index % SUB_TYPE_COLORS.length];
}
