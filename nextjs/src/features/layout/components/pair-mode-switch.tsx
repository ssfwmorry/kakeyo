'use client';

import { usePathname } from 'next/navigation';
import { useOptimistic, useTransition } from 'react';
import { IconShare } from '@/components/icons';
import { Switch } from '@/components/ui/switch';
import { setPairModeAction } from '@/features/layout/actions/pair-mode-actions';
import { PATHS_WITHOUT_PAIR } from '@/lib/shared/pair/pages-without-pair';

// 表示条件: ペアが存在し、かつ個人専用画面（PATHS_WITHOUT_PAIR）以外のときのみ表示する。
// 対象画面の定義は server 側とも共有するため lib/shared に置き、二重管理しない。
//
// 切替は Server Action で Cookie 更新 + 現在ページの再検証 → その画面が再 fetch される。
// サーバ往復のあいだ checked をサーバ確定値のままにすると「押してもつまみが動かず
// グレーアウトして待つ」体感になるため、useOptimistic でつまみだけ先行反映する
// （クライアント状態の更新だけで済ませられないぶん、体感が遅くなりうる）。
// 再検証が返れば isPair が新しい値で再レンダされ、楽観値は自然に破棄される。

export function PairModeSwitch({
  isExistPair,
  isPair
}: {
  isExistPair: boolean;
  isPair: boolean;
}) {
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  // startTransition の中でのみ更新できる（楽観値は transition 完了で巻き戻る）。
  const [optimisticIsPair, setOptimisticIsPair] = useOptimistic(isPair);

  if (!isExistPair || PATHS_WITHOUT_PAIR.includes(pathname)) {
    return null;
  }

  return (
    <div className='flex items-center gap-1.5 text-muted-foreground'>
      <IconShare className='size-5' aria-hidden />
      <Switch
        checked={optimisticIsPair}
        // 再検証の待ちで操作を止めない（連打は Server Action 側が最後の値で収束する）。
        aria-busy={isPending}
        aria-label='共有モード'
        onCheckedChange={(checked) => {
          startTransition(async () => {
            setOptimisticIsPair(checked);
            await setPairModeAction(checked, pathname);
          });
        }}
      />
    </div>
  );
}
