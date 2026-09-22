// 色名 → 実 CSS 色（hex）の対応（planned-record feature 内・純粋関数）。
// DB の color_classifications.name は Vuetify のマテリアル色名で保存される。
// record / type-method にも同等の対応表があるが、barrel が公開していない色関数を
// 他 feature の内部から直接 import するのは所有境界違反のため、自前で持つ
// （旧 Nuxt の COLOR_CODE を踏襲）。

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

// 色名 → hex。未知の色名はグレーにフォールバックする。
export function colorHex(name: string): string {
  return COLOR_HEX[name] ?? '#9e9e9e';
}
