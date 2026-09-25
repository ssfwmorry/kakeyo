'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ReactNode } from 'react';

// ライト／ダークの切替。初期値は端末の設定に従い（defaultTheme='system'）、
// ヘッダーのボタンで上書きしたときだけ localStorage に保存される。
//
// class 属性を html に付ける方式にしているのは、色トークン（v2/styles/tokens.css）が
// `.dark .v2-root` で切り替わるため。
//
// 移行中は v2 だけがダークに対応するので、Provider も v2 の layout に置いている。
// 全画面の移行が済んだら root layout へ引き上げる。
export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute='class'
      defaultTheme='system'
      disableTransitionOnChange
      enableSystem
    >
      {children}
    </NextThemesProvider>
  );
}
