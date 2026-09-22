'use client';

import { Share2 } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useTransition } from 'react';
import { Switch } from '@/components/ui/switch';
import { setPairModeAction } from '@/features/layout/actions/pair-mode-actions';
import { PATHS_WITHOUT_PAIR } from '@/lib/shared/pair/pages-without-pair';

// ペア切替スイッチ（旧 layouts/default.vue の v-switch を踏襲）。
// 表示条件: ペアが存在し（isExistPair）、かつ個人専用画面（PATHS_WITHOUT_PAIR =
// calendar / records / bank）以外のときのみ表示する（方針確定書 §8）。
// 「個人専用画面」の定義は lib/shared の単一の正を参照する（mode.ts と二重管理しない）。
// 切替は Server Action で Cookie 更新 + layout 再検証 → 全画面が再 fetch される。

export function PairModeSwitch({
  isExistPair,
  isPair
}: {
  isExistPair: boolean;
  isPair: boolean;
}) {
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  // ペアがいない or 個人専用画面では表示しない。
  if (!isExistPair || PATHS_WITHOUT_PAIR.includes(pathname)) {
    return null;
  }

  return (
    <div className='flex items-center gap-1.5 text-muted-foreground'>
      <Share2 className='size-5' aria-hidden />
      <Switch
        checked={isPair}
        disabled={isPending}
        aria-label='共有モード'
        onCheckedChange={(checked) => {
          startTransition(() => setPairModeAction(checked));
        }}
      />
    </div>
  );
}
