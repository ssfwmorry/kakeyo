// 色名 → 実 CSS 色（hex）の対応。DB の color_classifications.name は Vuetify の
// マテリアル色名（'red' / 'deep-purple' / ...）で保存されている。旧 Nuxt の
// COLOR_CODE を踏襲し、ショートカットカードの色分けを inline style で描く。
// 他 feature（bank / type-method）にも同等の定数があるが、feature 間の内部 import は
// 禁止のため memo-shortcut 内に自前で持つ（barrel 経由でない依存を作らない）。

export const SHORTCUT_COLOR_HEX: Record<string, string> = {
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
export function shortcutColorHex(name: string): string {
  return SHORTCUT_COLOR_HEX[name] ?? '#9e9e9e';
}
