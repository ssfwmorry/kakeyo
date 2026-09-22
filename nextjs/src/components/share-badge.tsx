import { cn } from 'cn';
import { Share2 } from 'lucide-react';

// 種別・方法などの「色マーカー＋共有シグナル」を 1 つで表す共通コンポーネント。
//
// - isPair=false: 単色の色丸。
// - isPair=true : 色丸の中に共有（Share2）アイコンを白抜きで内包。
// 色は呼び出し側で解決済みの hex を渡す。

type ShareBadgeProps = {
  colorHex: string;
  // true のとき色丸の中に共有アイコンを出す。
  isPair: boolean;
  // マーカーの直径を上書きする Tailwind の size-* クラス。既定は size-5。
  className?: string;
};

export function ShareBadge({ colorHex, isPair, className }: ShareBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full',
        'size-5',
        className
      )}
      style={{ backgroundColor: colorHex }}
    >
      {isPair ? (
        // 共有アイコンにラベルを持たせる（色丸自体は装飾）。
        <Share2 className='size-3 text-white' aria-label='共有' />
      ) : null}
    </span>
  );
}
