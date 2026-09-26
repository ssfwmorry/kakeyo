import type { ReactNode } from 'react';

// 画面の大見出し（30 / Bold）。右に「個人の設定」「共有の設定」のバッジを添えられる。
// タブバー直下の各画面が同じ形で持つので部品にしている。
//
// バッジの見た目は 2 種（共通仕様「画面の骨格」）: 個人は面（弱）の地に補足色、
// 共有はアクセント淡の地にアクセント色。

const BADGE = {
  self: {
    label: '個人の設定',
    className: 'bg-muted font-semibold text-muted-foreground'
  },
  pair: {
    label: '共有の設定',
    className: 'bg-secondary font-bold text-primary'
  }
} as const;

export function ScreenTitle({
  children,
  badge
}: {
  children: ReactNode;
  // その画面が個人／共有どちらの設定を扱っているか。
  badge?: keyof typeof BADGE;
}) {
  return (
    <div className='flex items-center gap-2.5'>
      <h1 className='font-bold text-3xl'>{children}</h1>
      {badge !== undefined ? (
        <span
          className={`inline-flex h-6 items-center rounded-xl px-2.5 text-xs ${BADGE[badge].className}`}
        >
          {BADGE[badge].label}
        </span>
      ) : null}
    </div>
  );
}

// 見出しの下の説明文（リード）。13px の補足色。
export function ScreenLead({ children }: { children: ReactNode }) {
  return (
    <p className='px-1 text-[13px] text-muted-foreground leading-relaxed'>
      {children}
    </p>
  );
}

// 一覧の下の注記。12px の補足色。
export function ScreenNote({ children }: { children: ReactNode }) {
  return (
    <p className='px-1 text-muted-foreground text-xs leading-relaxed'>
      {children}
    </p>
  );
}
