// summary 固有の色ヘルパ。色名 → hex の単一の正は @/features/master の colorHex。
// summary は「type 未設定（精算）= colorName が null」という固有の意味を持つため、
// null を精算色に寄せる薄いラッパだけをここに置く（マップは二重定義しない）。
import { colorHex as baseColorHex } from '@/features/master';
import { SETTLEMENT_DISPLAY } from '@/features/record';

// 精算（type 未設定）の表示名・色。単一の正は record の SETTLEMENT_DISPLAY
// （barrel 公開済み）。summary はそこから別名で公開し、'精算'/'yellow' を二重定義しない。
export const SETTLEMENT_COLOR_NAME = SETTLEMENT_DISPLAY.color;
export const SETTLEMENT_NAME = SETTLEMENT_DISPLAY.name;

// 色名 → hex。null（精算 = type 未設定）は精算色に寄せる。未知の色名はグレー。
export function colorHex(name: string | null): string {
  return baseColorHex(name ?? SETTLEMENT_COLOR_NAME);
}

// サブカテゴリ積み上げ棒用の固定色（旧 SummaryBarType の subTypeColors）。
// type 別の色（color_classifications）とは別系統で、1 カテゴリ内のサブカテゴリを
// 見分けるための循環パレット。Recharts の fill に直接渡すため hex で持つ
// （旧 CSS 色名 gold/mediumseagreen/... と同一色の hex 表現）。
// ★このパレットが「サブカテゴリ色」の単一の正。積み上げ棒の色供給（actions の
//   buildSubTypeStack）はここから import して使う（値の二重定義を作らない）。
export const SUB_TYPE_COLORS = [
  '#ffd700',
  '#3cb371',
  '#8a2be2',
  '#ffb6c1',
  '#4169e1',
  '#d2691e'
] as const;

// 「サブカテゴリなし」系列の色（旧 colorGrey）。
export const NO_SUB_TYPE_COLOR = '#9e9e9e';

export function subTypeColor(index: number): string {
  return SUB_TYPE_COLORS[index % SUB_TYPE_COLORS.length];
}
