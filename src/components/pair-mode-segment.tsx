'use client';

import { usePathname } from 'next/navigation';
import { useOptimistic, useTransition } from 'react';
import { ScopeSegment } from '@/components/scope-segment';
import { setPairModeAction } from '@/features/layout/actions/pair-mode-actions';

// ヘッダーのペアモード切替（集計・設定で見えるデータのスコープが変わる）。
// 見た目は ScopeSegment に委ね、ここは Cookie への反映だけを持つ。
//
// Server Action で Cookie を書いて現在ページを再検証する。サーバ往復のあいだ選択が動かないと
// 「押しても反応しない」体感になるため useOptimistic で先行反映する。

export function PairModeSegment({
  isPair,
  hasPair = true
}: {
  isPair: boolean;
  hasPair?: boolean;
}) {
  const pathname = usePathname();
  const [, startTransition] = useTransition();
  const [optimisticIsPair, setOptimisticIsPair] = useOptimistic(isPair);

  return (
    <ScopeSegment
      hasPair={hasPair}
      isPair={optimisticIsPair}
      onChange={(next) => {
        if (next === optimisticIsPair) {
          return;
        }
        startTransition(async () => {
          setOptimisticIsPair(next);
          await setPairModeAction(next, pathname);
        });
      }}
    />
  );
}
