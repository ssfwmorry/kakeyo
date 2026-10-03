'use client';

import { Popover } from '@base-ui/react/popover';
import { cn } from 'cn';
import type { ReactNode } from 'react';
import { IconInfo } from '@/components/icons';
import { POPUP_TRANSITION_CLASS } from '@/components/ui/popup-transition';

// ⓘ を押すと開く補足の説明。ラベルの横に添えて、画面には出し切れない意味を伝える。
//
// Tooltip ではなく Popover にする。Tooltip はホバーとフォーカスで開く部品で、
// タッチ端末ではタップしても開かない。
//
// シート（z-50）の上に出すため z-60。

export function InfoPopover({
  subject,
  children
}: {
  // 説明の対象名。「お財布」のように名詞で渡す。
  subject: string;
  children: ReactNode;
}) {
  return (
    <Popover.Root>
      <Popover.Trigger
        aria-label={`${subject}の説明`}
        className='flex size-6 shrink-0 items-center justify-center rounded-full text-muted-foreground data-popup-open:text-primary'
      >
        <IconInfo aria-hidden='true' className='size-4' strokeWidth={2} />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner
          align='start'
          className='z-[60]'
          collisionPadding={12}
          side='bottom'
          sideOffset={6}
        >
          <Popover.Popup
            className={cn(
              'w-[260px] rounded-xl bg-popover px-3.5 py-3 text-[13px] text-popover-foreground leading-relaxed shadow-[0_6px_20px_rgba(0,0,0,0.18)]',
              POPUP_TRANSITION_CLASS
            )}
          >
            {children}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
