import type { ReactNode } from 'react';
import { TabBar } from '@/components/tab-bar';

// タブバー付きの画面（カレンダー / 集計 / 口座 / 設定とその配下）。
//
// 上端は env(safe-area-inset-top) で逃がす。下端はタブバーが浮いて本文の上に
// 重なるので、バーの下端余白（12 か safe-area の大きい方）+ 高さ 56 + 間 12 ぶんを本文の下に空ける
// （各画面は自分では下端の余白を持たない）。

export default function TabsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {/* 各画面は内容の高さで積み、はみ出す分をここでスクロールさせる。
          min-h-0 がないと中身の高さで膨らみ flex-1 が頭打ちにならない。 */}
      <main
        className='flex min-h-0 flex-1 flex-col overflow-y-auto'
        style={{
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'calc(max(12px, env(safe-area-inset-bottom)) + 68px)'
        }}
      >
        {children}
      </main>
      <TabBar />
    </>
  );
}
