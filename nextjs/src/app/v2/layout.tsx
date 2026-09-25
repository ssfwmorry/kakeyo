import type { ReactNode } from 'react';
import { requireAuth } from '@/features/auth/server/requireAuth';
import { OfflineBanner } from '@/features/pwa/components/offline-banner';
import { getLastUsedMethodIds } from '@/features/record/server/services';
import {
  getMethodCardList,
  getTypeCardList
} from '@/features/type-method/server/services';
import { getEffectivePairMode } from '@/lib/server/pair/mode';
import { todayJst } from '@/lib/shared/domain/date';
import { ThemeProvider } from '@/v2/components/theme-provider';
import { V2Toaster } from '@/v2/components/toaster';
import { NoteModalProvider } from '@/v2/features/note/components/note-modal';

// 新デザインのシェル（docs/new-design/README.md）。移行が終わるまで (private) と並走する。
//
// 既存の (private)/layout.tsx との違い:
// - 上部の共通バー（ベル・ペア切替）を持たない。新デザインでは各画面が自分の
//   ヘッダを持ち、そこに「個人｜共有」とダーク切替を置く（位置は全画面で揃える）。
// - 色は .v2-root スコープのトークンで塗る。既存画面には一切影響しない。
//
// 入力の全画面モーダルはここが持つ（README D1）。どのタブからでも開いて閉じると
// 元のタブに戻るので、タブより外側に置く必要がある。候補（カテゴリ・方法・前回の方法）も
// ここで 1 度だけ取る。
//
// 認証ガードは (private) と同じく requireAuth。Proxy に加えた多層防御。

export default async function V2Layout({ children }: { children: ReactNode }) {
  const session = await requireAuth();

  const [typeList, methodList, lastUsedMethodIds, isPair] = await Promise.all([
    getTypeCardList(session),
    getMethodCardList(session),
    getLastUsedMethodIds(session),
    getEffectivePairMode(session)
  ]);

  return (
    <ThemeProvider>
      {/* v2-root がトークンの適用範囲。ここから内側だけが新デザインの色になる。
          外側の 1 枚は PC 幅で余る左右を塗るためだけのもの。これがないと、
          はみ出した部分に旧トークンの body 色が出る。 */}
      <div className='v2-root min-h-dvh bg-background text-foreground'>
        {/* トーストは v2-root の内側に置く（トークンを引くため）。root layout の
            Toaster は v2 配下では描画されない（LegacyToaster）。 */}
        <V2Toaster>
          <div className='mx-auto flex h-dvh w-full max-w-md flex-col overflow-hidden bg-background sm:border-x'>
            <NoteModalProvider
              candidates={{
                typeList,
                methodList,
                lastUsedMethodIds,
                isPair,
                hasPair: session.pairId !== null,
                today: todayJst()
              }}
            >
              <OfflineBanner />
              {children}
            </NoteModalProvider>
          </div>
        </V2Toaster>
      </div>
    </ThemeProvider>
  );
}
