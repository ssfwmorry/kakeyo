import type { ReactNode } from 'react';
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
// 候補の DB 3 クエリは await せず Promise のまま渡す。候補が要るのは入力モーダルを
// 開いたときだけで、ここで await すると (private) 配下の全画面がその解決を待って
// 1px も描画できない（= 静的シェルが生まれず tab-bar の prefetch が空振りする）。
// 取得はこの時点で始まるので、＋ を押す頃にはほぼ解決済み。
//
// 認証ガードは requireAuth。Proxy に加えた多層防御。
//
// 幅はスマホ専用（max-w-md = 448px）。PC で開いたときは shell ごと中央に寄せ、
// sm 以上では左右の境界線で輪郭を出す。幅の制限は shell 1 箇所で持ち、
// 各画面（page / *-screen）は max-w を持たない。

export default async function PrivateLayout({
  children
}: {
  children: ReactNode;
}) {
  const session = await requireAuth();

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
    <div className='mx-auto flex h-dvh w-full max-w-md flex-col overflow-hidden bg-background sm:border-x'>
      <NoteModalProvider candidates={candidates} today={todayJst()}>
        <OfflineBanner />
        {children}
      </NoteModalProvider>
    </div>
  );
}
