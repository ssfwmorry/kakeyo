import { colorVar } from '@/features/master';

// カテゴリ・方法の行頭に出す色の丸。中に名前の頭文字を入れる（デザイン基礎 SetType / SetMethod）。
// 頭文字の色はライトで白、ダークで地の色（--cat-on）。

export function InitialCircle({
  name,
  colorName,
  size = 32
}: {
  name: string;
  colorName: string;
  // 一覧は 32、編集画面の見出しは 56。
  size?: 32 | 56;
}) {
  return (
    <span
      aria-hidden='true'
      className='flex shrink-0 items-center justify-center rounded-full font-bold text-[var(--cat-on)]'
      style={{
        backgroundColor: colorVar(colorName),
        fontSize: size === 56 ? 24 : 14,
        height: size,
        width: size
      }}
    >
      {/* 絵文字や結合文字で壊れないよう、コードポイント単位の先頭 1 文字を取る。 */}
      {[...name][0] ?? ''}
    </span>
  );
}
