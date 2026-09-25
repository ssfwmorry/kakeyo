import type { ReactNode } from 'react';
import { TabBar } from '@/v2/components/tab-bar';

// タブバー付きの画面（カレンダー / 集計 / 口座 / 設定とその配下）。
//
// 上端は env(safe-area-inset-top) で逃がす。下端はタブバー側で見ている。

export default function V2TabsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {/* 各画面は内容の高さで積み、はみ出す分をここでスクロールさせる。
          min-h-0 がないと中身の高さで膨らみ flex-1 が頭打ちにならない。 */}
      <main
        className='flex min-h-0 flex-1 flex-col overflow-y-auto'
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        {children}
      </main>
      <TabBar />
    </>
  );
}
