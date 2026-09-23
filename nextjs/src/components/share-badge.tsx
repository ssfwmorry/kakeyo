import { cn } from 'cn';
import { IconShare } from '@/components/icons';

// 種別・方法などの「色マーカー＋共有シグナル」を 1 つで表す共通コンポーネント。
//
// - isPair=false: 単色のマーカー。
// - isPair=true : マーカーの中に共有アイコン（IconShare＝2 人）を白抜きで内包。
//
// 共有シグナルは全画面で 2 人アイコンに統一するので、
// アイコンは共通定義の IconShare だけを使う（各所で lucide を直 import しない）。
// 形状は種別＝丸 / 予定種別＝四角を
// shape で選べるようにする。色は呼び出し側で解決済みの hex を渡す。

type ShareBadgeProps = {
  colorHex: string;
  // true のときマーカーの中に共有アイコンを出す。
  isPair: boolean;
  // 'circle'（既定・種別/方法など） or 'square'（予定種別の色ブロック）。
  shape?: 'circle' | 'square';
  // マーカーの直径を上書きする Tailwind の size-* クラス。既定は size-5。
  className?: string;
};

export function ShareBadge({
  colorHex,
  isPair,
  shape = 'circle',
  className
}: ShareBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center',
        shape === 'circle' ? 'rounded-full' : 'rounded-xs',
        'size-5',
        className
      )}
      style={{ backgroundColor: colorHex }}
    >
      {isPair ? (
        // 共有アイコンにラベルを持たせる（マーカー自体は装飾）。
        <IconShare className='size-3 text-white' aria-label='共有' />
      ) : null}
    </span>
  );
}
