'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useOptimistic, useTransition } from 'react';
import { IconShare } from '@/components/icons';
import { Switch } from '@/components/ui/switch';
import { setPairModeAction } from '@/features/layout/actions/pair-mode-actions';
import {
  PAIR_LOCKED_QUERY_KEYS,
  PATHS_WITHOUT_PAIR
} from '@/lib/shared/pair/pages-without-pair';

// 表示条件: ペアが存在し、かつ個人専用画面（PATHS_WITHOUT_PAIR）以外のときのみ表示する。
// 対象画面の定義は server 側とも共有するため lib/shared に置き、二重管理しない。
//
// 切替は Server Action で Cookie 更新 + 現在ページの再検証 → その画面が再 fetch される。
// サーバ往復のあいだ checked をサーバ確定値のままにすると「押してもつまみが動かず
// グレーアウトして待つ」体感になるため、useOptimistic でつまみだけ先行反映する
// （クライアント状態の更新だけで済ませられないぶん、体感が遅くなりうる）。
// 再検証が返れば isPair が新しい値で再レンダされ、楽観値は自然に破棄される。

// 1 件編集のクエリで入ってくる画面。ここ以外はロックが起こりえない。
const PAIR_LOCKABLE_PATHS = ['/note', '/plan'];

export function PairModeSwitch({
  isExistPair,
  isPair
}: {
  isExistPair: boolean;
  isPair: boolean;
}) {
  const pathname = usePathname();

  if (!isExistPair || PATHS_WITHOUT_PAIR.includes(pathname)) {
    return null;
  }

  // このスイッチは全画面の共通ヘッダに常駐する。ロック判定に要る useSearchParams を
  // ここで購読すると、クエリを使わない画面まで含めた全ルートがクエリ変化のたびに
  // 再レンダされる。購読は編集導線を持つ画面用の実装に閉じ、他は購読ごと省く。
  return PAIR_LOCKABLE_PATHS.includes(pathname) ? (
    <LockablePairModeSwitch pathname={pathname} isPair={isPair} />
  ) : (
    <PairModeSwitchView pathname={pathname} isPair={isPair} isLocked={false} />
  );
}

// 編集中（?RECORD= 等）はモードを固定する。対象は作成時に共有/個人が決まり後から
// 移せないため、切り替えても編集できず入力中の値を失うだけになる。
function LockablePairModeSwitch({
  pathname,
  isPair
}: {
  pathname: string;
  isPair: boolean;
}) {
  const searchParams = useSearchParams();
  const isLocked = PAIR_LOCKED_QUERY_KEYS.some(
    (key) => searchParams.get(key) !== null
  );
  return (
    <PairModeSwitchView
      pathname={pathname}
      isPair={isPair}
      isLocked={isLocked}
    />
  );
}

function PairModeSwitchView({
  pathname,
  isPair,
  isLocked
}: {
  pathname: string;
  isPair: boolean;
  isLocked: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  // startTransition の中でのみ更新できる（楽観値は transition 完了で巻き戻る）。
  const [optimisticIsPair, setOptimisticIsPair] = useOptimistic(isPair);

  return (
    <div className='flex items-center gap-1.5 text-muted-foreground'>
      <IconShare className='size-5' aria-hidden />
      <Switch
        checked={optimisticIsPair}
        disabled={isLocked}
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
