import type { ReactNode } from 'react';
import { Suspense } from 'react';
import { requireAuth } from '@/features/auth/server/requireAuth';
import { OfflineBanner } from '@/features/pwa/components/offline-banner';
import { NoteModalProvider } from '@/features/record/components/note-modal';
import {
  getMethodCardList,
  getTypeCardList
} from '@/features/type-method/server/services';
import { getEffectivePairMode } from '@/lib/server/pair/mode';
import { todayJst } from '@/lib/shared/domain/date';

// 認証必須画面の共有 layout（アプリのシェル。docs/new-design/README.md）。
//
// 上部の共通バーは持たない。各画面が自分のヘッダを持ち、そこに「個人｜共有」と
// ダーク切替を置く（位置は全画面で揃える）。
//
// 入力の全画面モーダルはここが持つ（README D1）。どのタブからでも開いて閉じると
// 元のタブに戻るので、タブより外側に置く必要がある。候補（カテゴリ・方法）も
// ここで 1 度だけ取る。
//
// 幅はスマホ専用（max-w-md = 448px）。PC で開いたときは shell ごと中央に寄せ、
// sm 以上では左右の境界線で輪郭を出す。幅の制限は shell 1 箇所で持ち、
// 各画面（page / *-screen）は max-w を持たない。
//
// 【Cache Components】外枠の div は runtime data を読まないので静的シェルとして
// 事前描画され、タブ遷移が即座に骨格を出せる（tab-bar の prefetch はこれが無いと
// 空振りする）。セッションを読む部分だけを Suspense の内側に落とす。layout の
// top-level で await すると {children} ごとその解決の後ろに回るため。

export default function PrivateLayout({ children }: { children: ReactNode }) {
  return (
    <div className='mx-auto flex h-dvh w-full max-w-md flex-col overflow-hidden bg-background sm:border-x'>
      <Suspense fallback={<div className='flex min-h-0 flex-1 flex-col' />}>
        <AuthenticatedShell>{children}</AuthenticatedShell>
      </Suspense>
    </div>
  );
}

// 認証ガードはここ。未ログインは requireAuth が redirect する。
//
// Suspense の内側なのでシェルが一瞬出てからリダイレクトされるが、シェルはデータを
// 持たない外枠だけなので漏洩にはならない。未認証で (private) に到達する経路自体は
// proxy.ts が塞いでおり、requireAuth は多層防御の 2 枚目。
async function AuthenticatedShell({ children }: { children: ReactNode }) {
  const session = await requireAuth();

  // 候補は入力モーダルを開くまで要らないので await せず Promise のまま渡し、
  // シート側の Suspense 内で use() する。ここで await すると配下の画面が
  // この DB 3 クエリの解決まで描画を始められない。
  const candidates = Promise.all([
    getTypeCardList(session),
    getMethodCardList(session),
    getEffectivePairMode(session)
  ]).then(([typeList, methodList, isPair]) => ({
    typeList,
    methodList,
    isPair,
    hasPair: session.pairId !== null
  }));

  return (
    <NoteModalProvider candidates={candidates} today={todayJst()}>
      <OfflineBanner />
      {children}
    </NoteModalProvider>
  );
}
