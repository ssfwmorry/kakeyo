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

// サブカテゴリ積み上げ棒用の色。サブカテゴリは DB に色を持たないので、
// 1 カテゴリ内で見分けるための循環パレットを当てる。
// 色名で持つのは type 別の色と同じ扱いにするため（描画時に colorVar で
// --cat-* へ解決し、ライト／ダークに追従させる）。
export const SUB_TYPE_COLORS = [
  'amber',
  'green',
  'deep-purple',
  'pink',
  'indigo',
  'brown'
] as const;

// 「サブカテゴリなし」系列の色名。実体のある分類ではないのでグレーに落とす。
export const NO_SUB_TYPE_COLOR = 'grey';

export function subTypeColor(index: number): string {
  return SUB_TYPE_COLORS[index % SUB_TYPE_COLORS.length];
}
