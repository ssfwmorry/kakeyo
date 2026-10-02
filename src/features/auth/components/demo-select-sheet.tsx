'use client';

import type { ComponentType, SVGProps } from 'react';
import { useFormAction } from '@/components/form/use-form-action';
import { IconChevronRight, IconShare, IconUser } from '@/components/icons';
import { SheetHeader } from '@/components/sheet-header';
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetDescription
} from '@/components/ui/bottom-sheet';
import { DemoMode } from '@/features/demo';
import { demoLoginAction } from '../actions/login-actions';
import { authLabels } from '../labels';

const { demo } = authLabels;

// デモのアカウント種別（ペアあり / ペアなし）を選ぶシート。
//
// ログイン欄やとりせつと同じ画面に並べず、シートに切り出して背景を暗転させる。
// 開いている間はモードを選ぶことだけが残り、閉じ方（×・下スワイプ）も
// アプリ内のシートと同じになる。
//
// 選んだ時点で Server Action がデモ Cookie を発行して遷移する（「決定」は置かない）。
// 遷移までの間は両方の選択肢を押せなくし、押した側に処理中の印を出す。

export function DemoSelectSheet({
  isOpen,
  onOpenChange
}: {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}) {
  const [, pairLogin, isPairPending] = useFormAction(() =>
    demoLoginAction(DemoMode.pair)
  );
  const [, soloLogin, isSoloPending] = useFormAction(() =>
    demoLoginAction(DemoMode.solo)
  );
  const isPending = isPairPending || isSoloPending;

  return (
    <BottomSheet onOpenChange={onOpenChange} open={isOpen}>
      <BottomSheetContent aria-label={demo.selectTitle}>
        <SheetHeader
          left='close'
          onLeft={() => onOpenChange(false)}
          title={demo.selectTitle}
        />
        <BottomSheetDescription className='px-1'>
          {demo.selectHint}
        </BottomSheetDescription>

        <div className='flex flex-col gap-2'>
          <form action={pairLogin}>
            <DemoOption
              disabled={isPending}
              hint={demo.pairHint}
              icon={IconShare}
              isPending={isPairPending}
              title={demo.pair}
            />
          </form>
          <form action={soloLogin}>
            <DemoOption
              disabled={isPending}
              hint={demo.soloHint}
              icon={IconUser}
              isPending={isSoloPending}
              title={demo.solo}
            />
          </form>
        </div>
      </BottomSheetContent>
    </BottomSheet>
  );
}

function DemoOption({
  icon: Icon,
  title,
  hint,
  isPending,
  disabled
}: {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  title: string;
  hint: string;
  isPending: boolean;
  disabled: boolean;
}) {
  return (
    <button
      className='flex w-full items-center gap-3 rounded-xl bg-card py-3.5 pr-3 pl-4 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50'
      disabled={disabled}
      type='submit'
    >
      <span className='flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-primary'>
        <Icon aria-hidden='true' className='size-5' />
      </span>
      <span className='flex min-w-0 flex-1 flex-col gap-0.5'>
        <span className='font-semibold text-[15px] text-foreground'>
          {title}
        </span>
        <span className='text-[13px] text-muted-foreground leading-snug'>
          {hint}
        </span>
      </span>
      {isPending ? (
        <span
          aria-hidden='true'
          className='size-4 shrink-0 animate-spin rounded-full border-2 border-primary border-t-transparent'
        />
      ) : (
        <IconChevronRight
          aria-hidden='true'
          className='size-4.5 shrink-0 text-icon-muted'
          strokeWidth={2.4}
        />
      )}
    </button>
  );
}
