import { colorVar } from '@/features/master';

// カテゴリ・方法の行頭に出す色の丸。中に名前の頭文字を入れる（デザイン基礎 SetType / SetMethod）。
// 頭文字の色はライトで白、ダークで地の色（--cat-on）。

const INITIAL_FONT_SIZE = { 32: 14, 40: 16, 56: 24 } as const;

export function InitialCircle({
  name,
  colorName,
  size = 32
}: {
  name: string;
  colorName: string;
  // 一覧は 32、入力フローのカテゴリ格子は 40、編集画面の見出しは 56。
  size?: 32 | 40 | 56;
}) {
  return (
    <span
      aria-hidden='true'
      className='flex shrink-0 items-center justify-center rounded-full font-bold text-[var(--cat-on)]'
      style={{
        backgroundColor: colorVar(colorName),
        fontSize: INITIAL_FONT_SIZE[size],
        height: size,
        width: size
      }}
    >
      {/* 絵文字や結合文字で壊れないよう、コードポイント単位の先頭 1 文字を取る。 */}
      {[...name][0] ?? ''}
    </span>
  );
}
