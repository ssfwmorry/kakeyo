import type { ReactNode } from 'react';
import { requireAuth } from '@/features/auth/server/requireAuth';
import { OfflineBanner } from '@/features/pwa/components/offline-banner';
import { TabBar } from '@/v2/components/tab-bar';
import { ThemeProvider } from '@/v2/components/theme-provider';

// 新デザインのシェル（docs/new-design/README.md）。移行が終わるまで (private) と並走する。
//
// 既存の (private)/layout.tsx との違い:
// - 上部の共通バー（ベル・ペア切替）を持たない。新デザインでは各画面が自分の
//   ヘッダを持ち、そこに「個人｜共有」とダーク切替を置く（位置は全画面で揃える）。
// - 色は .v2-root スコープのトークンで塗る。既存画面には一切影響しない。
// - 上端は env(safe-area-inset-top) で逃がす。下端はタブバー側で見ている。
//
// 認証ガードは (private) と同じく requireAuth。Proxy に加えた多層防御。

export default async function V2Layout({ children }: { children: ReactNode }) {
  await requireAuth();

  return (
    <ThemeProvider>
      {/* v2-root がトークンの適用範囲。ここから内側だけが新デザインの色になる。
          外側の 1 枚は PC 幅で余る左右を塗るためだけのもの。これがないと、
          はみ出した部分に旧トークンの body 色が出る。 */}
      <div className='v2-root min-h-dvh bg-background text-foreground'>
        <div className='mx-auto flex h-dvh w-full max-w-md flex-col bg-background sm:border-x'>
          <OfflineBanner />
          {/* 各画面は内容の高さで積み、はみ出す分をここでスクロールさせる。
              min-h-0 がないと中身の高さで膨らみ flex-1 が頭打ちにならない。 */}
          <main
            className='flex min-h-0 flex-1 flex-col overflow-y-auto'
            style={{ paddingTop: 'env(safe-area-inset-top)' }}
          >
            {children}
          </main>
          <TabBar />
        </div>
      </div>
    </ThemeProvider>
  );
}
