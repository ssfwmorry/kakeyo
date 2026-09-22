// 色名 → 実 CSS 色（hex）の対応。DB の color_classifications.name は Vuetify の
// マテリアル色名（'red' / 'deep-purple' / ...）で保存されている。旧 Nuxt の
// COLOR_CODE を踏襲し、予定カテゴリ・リマインダーの色チップを inline style で描く。
// 色マスタの型は @/features/master の barrel から参照するが、hex 対応は FE 表示の
// 関心事のため feature 内に自前で持つ（feature 間の内部 import を作らない）。

export const PLAN_COLOR_HEX: Record<string, string> = {
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
export function planColorHex(name: string): string {
  return PLAN_COLOR_HEX[name] ?? '#9e9e9e';
}
