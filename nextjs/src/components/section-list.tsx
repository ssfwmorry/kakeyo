import { cn } from 'cn';
import type { ReactNode } from 'react';

// 「小さな見出し + 白いカード」の組。設定・一覧系の画面はこれを縦に積んで作る。
// カードは影を使わず、地（--background）との明度差だけで浮かせる（デザイン基礎）。
//
// 角丸は設定系が 14、ホーム・集計・口座のカードが 16（共通仕様「リストのセル」）。

export function SectionList({
  title,
  children,
  className,
  radius = 14
}: {
  // 省略するとカードだけを出す。
  title?: ReactNode;
  children: ReactNode;
  className?: string;
  radius?: 14 | 16;
}) {
  return (
    <section className={cn('flex flex-col gap-1.5', className)}>
      {title !== undefined ? (
        <h2 className='pl-3.5 text-muted-foreground text-[13px]'>{title}</h2>
      ) : null}
      {/* overflow-hidden は角丸からセルの地色がはみ出さないようにするため。 */}
      <div
        className={cn(
          'overflow-hidden bg-card',
          radius === 14 ? 'rounded-[14px]' : 'rounded-2xl'
        )}
      >
        {children}
      </div>
    </section>
  );
}

// カードの中の空状態。高さ 88 の中央に補足色の 1 文。
export function SectionListEmpty({ children }: { children: ReactNode }) {
  return (
    <p className='flex h-22 items-center justify-center text-muted-foreground text-sm'>
      {children}
    </p>
  );
}
