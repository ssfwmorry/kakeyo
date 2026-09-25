import type { ReactNode } from 'react';

// 画面の大見出し（30 / Bold）。右に「個人の設定」などのチップを添えられる。
// タブバー直下の各画面が同じ形で持つので部品にしている。

export function ScreenTitle({
  children,
  badge
}: {
  children: ReactNode;
  // 見出しの右に添えるチップ。個人／共有の区別など、その画面の但し書き。
  badge?: ReactNode;
}) {
  return (
    <div className='flex items-center gap-2.5'>
      <h1 className='font-bold text-3xl'>{children}</h1>
      {badge !== undefined ? (
        <span className='inline-flex h-6 items-center rounded-xl bg-muted px-2.5 font-semibold text-muted-foreground text-xs'>
          {badge}
        </span>
      ) : null}
    </div>
  );
}
