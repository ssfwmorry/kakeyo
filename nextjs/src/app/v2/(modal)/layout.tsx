import type { ReactNode } from 'react';

// 全画面モーダルとして開く画面（入力フロー）。タブバーを持たず、閉じる導線は
// 画面の左上に置く（デザイン基礎「中央の ＋ は入力を全画面モーダルで開く」）。
//
// 下端の余白は各画面が持つ。登録ボタンをホームバーの上に置くため、
// 画面ごとに env(safe-area-inset-bottom) を見る。

export default function V2ModalLayout({ children }: { children: ReactNode }) {
  return (
    <main
      className='flex min-h-0 flex-1 flex-col overflow-y-auto'
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      {children}
    </main>
  );
}
