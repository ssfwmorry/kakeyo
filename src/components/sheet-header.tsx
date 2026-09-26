'use client';

import type { ReactNode } from 'react';
import { IconChevronLeft, IconClose, IconTrash } from '@/components/icons';
import { BottomSheetTitle } from '@/components/ui/bottom-sheet';
import { RoundIconButton } from '@/components/ui/round-icon-button';

// シートの上端。「丸い×（または‹）｜タイトル｜右のアクション」の 3 列で、
// デザインの全シートがこの形（共通仕様「ボトムシート」）。
//
// 左は 36px の丸ボタン。閉じるか戻るかは left で決める。
// 右は編集時のゴミ箱が典型で、無ければ空けて中央のタイトルを真ん中に保つ。

type SheetHeaderLeft = 'close' | { back: string } | ReactNode;

export function SheetHeader({
  left,
  onLeft,
  title,
  tag,
  right
}: {
  // 'close' = ×（閉じる）。{ back } = ‹（戻る。値は aria-label）。ReactNode で任意の要素も置ける。
  left: SheetHeaderLeft;
  // left が 'close' / back のときの押下。
  onLeft?: () => void;
  // 文字列なら BottomSheetTitle として出す（Drawer のアクセシブルネームになる）。
  title: ReactNode;
  // タイトルの右に添える小さなタグ（「共有」など）。
  tag?: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div className='grid h-11 shrink-0 grid-cols-[minmax(44px,auto)_1fr_minmax(44px,auto)] items-center'>
      <span className='justify-self-start'>
        <LeftControl left={left} onLeft={onLeft} />
      </span>
      <span className='flex min-w-0 items-center justify-center gap-2'>
        {typeof title === 'string' ? (
          <BottomSheetTitle className='truncate'>{title}</BottomSheetTitle>
        ) : (
          title
        )}
        {tag !== undefined ? <SheetTag>{tag}</SheetTag> : null}
      </span>
      <span className='justify-self-end'>{right}</span>
    </div>
  );
}

function isBack(left: SheetHeaderLeft): left is { back: string } {
  return (
    typeof left === 'object' &&
    left !== null &&
    'back' in left &&
    typeof left.back === 'string'
  );
}

function LeftControl({
  left,
  onLeft
}: {
  left: SheetHeaderLeft;
  onLeft?: () => void;
}) {
  if (left === 'close') {
    return (
      <RoundIconButton aria-label='閉じる' onClick={onLeft}>
        <IconClose aria-hidden='true' className='size-4.5' strokeWidth={2.4} />
      </RoundIconButton>
    );
  }
  if (isBack(left)) {
    return (
      <RoundIconButton aria-label={left.back} onClick={onLeft}>
        <IconChevronLeft
          aria-hidden='true'
          className='size-4.5'
          strokeWidth={2.4}
        />
      </RoundIconButton>
    );
  }
  return <>{left}</>;
}

// タイトル横の小さなタグ。「共有」など、そのシートが扱う対象の区分を示す。
export function SheetTag({ children }: { children: ReactNode }) {
  return (
    <span className='inline-flex h-5 shrink-0 items-center rounded-md bg-secondary px-1.5 font-bold text-[11px] text-primary'>
      {children}
    </span>
  );
}

// ヘッダー右のゴミ箱。編集時だけ出す。
export function SheetTrashButton({
  label,
  onClick,
  disabled
}: {
  // 「この◯◯を削除」。
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <RoundIconButton
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      tone='destructive'
    >
      <IconTrash aria-hidden='true' className='size-4.5' />
    </RoundIconButton>
  );
}
