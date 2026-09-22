import { cn } from 'cn';
import { Share2 } from 'lucide-react';

// 種別・方法などの「色マーカー＋共有シグナル」を 1 つで表す共通コンポーネント。
// 旧 Vue の色付きアバター（ペア時は中に SHARE アイコンを内包）を移植（差分リスト G-1 / H-1）。
// 色ドットが全画面で小丸に平坦化し共有アイコンが消えた退化を、この 1 部品で復元・統一する。
//
// - isPair=false: 単色の色丸（従来どおり）。
// - isPair=true : 色丸の中に共有（Share2）アイコンを白抜きで内包。
// 色は呼び出し側で解決済みの hex を渡す（master/colorHex）。

type ShareBadgeProps = {
  // 解決済みの色（hex）。
  colorHex: string;
  // 共有（ペア）record/method かどうか。true のとき中に共有アイコンを出す。
  isPair: boolean;
  // マーカーの直径（Tailwind の size-* クラス）。既定は size-5。
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
