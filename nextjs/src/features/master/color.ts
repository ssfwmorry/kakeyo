// 色名 → 実 CSS 色（hex）の対応（色マスタ所有 feature = master・純粋関数・FE/BE 両用）。
// DB の color_classifications.name は Vuetify のマテリアル色名（'red' / 'deep-purple'
// / ...）で保存される。旧 Nuxt の COLOR_CODE を踏襲し、カード文字色・チャート系列色・
// 色チップを inline style で描く。色マスタは master の所有物なので hex 対応もここが
// 単一の正（各 feature で二重定義しない）。barrel から公開して全レーンが共有する。

export const COLOR_HEX: Record<string, string> = {
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

// 未知の色名のフォールバック（グレー）。
export const FALLBACK_COLOR_HEX = '#9e9e9e';

// 色名 → hex。未知の色名はグレーにフォールバックする。
export function colorHex(name: string): string {
  return COLOR_HEX[name] ?? FALLBACK_COLOR_HEX;
}
