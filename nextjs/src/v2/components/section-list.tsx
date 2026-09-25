import { cn } from 'cn';
import type { ReactNode } from 'react';

// 「小さな見出し + 白いカード」の組。設定・一覧系の画面はこれを縦に積んで作る。
// カードは影を使わず、地（--background）との明度差だけで浮かせる（デザイン基礎）。

export function SectionList({
  title,
  children,
  className
}: {
  // 省略するとカードだけを出す。
  title?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('flex flex-col gap-1.5', className)}>
      {title !== undefined ? (
        <h2 className='pl-3.5 text-muted-foreground text-[13px]'>{title}</h2>
      ) : null}
      {/* overflow-hidden は角丸からセルの地色がはみ出さないようにするため。 */}
      <div className='overflow-hidden rounded-2xl bg-card'>{children}</div>
    </section>
  );
}
