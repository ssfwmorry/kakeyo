'use client';

import { Drawer } from '@base-ui/react/drawer';
import { cn } from 'cn';

// 下から出るシート。新デザインでは Dialog を全てこれに置き換える
// （デザイン基礎「Dialog はすべて下から出るシートに置き換える」）。
//
// Base UI の Drawer を使う。swipeDirection の既定が 'down' なので、下スワイプで閉じる。
// 上端のグラバー（掴み棒）はデザインにある 36×5px の棒で、「掴んで下げられる」ことの
// 手がかりとして出す。
//
// 既存 components/ui/sheet.tsx（Dialog ベース）との違いは、出る向きが下だけなことと、
// 角丸・暗幕・下端の余白を新デザインのトークンに合わせていること。
//
// Portal で body 直下に出るため、トークンを効かせるために v2-root を付け直している。

export const BottomSheet = Drawer.Root;
export const BottomSheetTrigger = Drawer.Trigger;
export const BottomSheetClose = Drawer.Close;

export function BottomSheetContent({
  className,
  children,
  ...props
}: Drawer.Popup.Props) {
  return (
    <Drawer.Portal>
      <Drawer.Backdrop className='fixed inset-0 z-50 bg-[var(--overlay)] transition-opacity duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0' />
      <Drawer.Viewport className='fixed inset-0 z-50 flex items-end justify-center'>
        <Drawer.Popup
          className={cn(
            // シェルと同じ幅に収める。PC 幅で画面いっぱいに広がらないようにする。
            'v2-root flex max-h-[85dvh] w-full max-w-md flex-col rounded-t-[20px] bg-popover text-popover-foreground',
            className
          )}
          data-slot='bottom-sheet-content'
          {...props}
        >
          {/* 掴み棒。押し下げて閉じられることの手がかり。 */}
          <div
            aria-hidden='true'
            className='mx-auto mt-2 h-[5px] w-9 shrink-0 rounded-full bg-muted-foreground/40'
          />
          <Drawer.Content
            className='flex flex-col gap-4 overflow-y-auto px-4 pt-2'
            style={{
              paddingBottom: 'max(env(safe-area-inset-bottom), 20px)'
            }}
          >
            {children}
          </Drawer.Content>
        </Drawer.Popup>
      </Drawer.Viewport>
    </Drawer.Portal>
  );
}

export function BottomSheetTitle({ className, ...props }: Drawer.Title.Props) {
  return (
    <Drawer.Title
      className={cn('font-bold text-xl', className)}
      data-slot='bottom-sheet-title'
      {...props}
    />
  );
}

export function BottomSheetDescription({
  className,
  ...props
}: Drawer.Description.Props) {
  return (
    <Drawer.Description
      className={cn('text-muted-foreground text-[13px]', className)}
      data-slot='bottom-sheet-description'
      {...props}
    />
  );
}
