// 色名 → 実 CSS 色（hex）の対応。DB の color_classifications.name は Vuetify の
// マテリアル色名（'red' / 'deep-purple' / ...）で保存され、inline style で描く。
// hex 対応はここを単一の正とし、各 feature で二重定義しない。

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

export function colorHex(name: string): string {
  return COLOR_HEX[name] ?? FALLBACK_COLOR_HEX;
}

// --- 新デザイン用 ---------------------------------------------------------
// 新デザインは同じ色名をライト/ダークで別の hex に描き分ける。実値は
// v2/styles/tokens.css の --cat-* が持ち、ここは「色名 → CSS 変数」の対応だけを返す。
// hex を直接返さないのは、テーマ切替に CSS 側で追従させ、SSR とクライアントで
// 色が食い違わないようにするため。

// 既知の色名かどうか。未知なら --cat-fallback へ落とす。
const COLOR_NAMES = new Set(Object.keys(COLOR_HEX));

// 色名 → CSS 変数参照。inline style の値としてそのまま使う。
export function colorVar(name: string | null): string {
  return name !== null && COLOR_NAMES.has(name)
    ? `var(--cat-${name})`
    : 'var(--cat-fallback)';
}

// カテゴリ色の丸に載せる頭文字の色。ライトは白、ダークは地の色。
export const CATEGORY_ON_COLOR = 'var(--cat-on)';
