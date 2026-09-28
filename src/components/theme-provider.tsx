'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ReactNode } from 'react';

// ライト／ダークの切替。初期値は端末の設定に従い（defaultTheme='system'）、
// ヘッダーのボタンで上書きしたときだけ localStorage に保存される。
//
// class 属性を html に付ける方式にしているのは、色トークン（globals.css）が
// `.dark` で切り替わるため。
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
