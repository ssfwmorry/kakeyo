'use client';

import { Dialog as SheetPrimitive } from '@base-ui/react/dialog';
import { cn } from 'cn';

// 下から出るシート。新デザインでは Dialog を全てこれに置き換える
// （デザイン基礎「Dialog はすべて下から出るシートに置き換える」）。
//
// 既存 components/ui/sheet.tsx との違い:
// - 出る向きは下だけ。上下左右を切り替えない。
// - 上端だけ角丸 20。下端は画面の縁に付く。
// - 暗幕は --overlay。ダークでも同じ濃さに見えるようトークンで持つ。
// - 下端の余白を env(safe-area-inset-bottom) で逃がす。
// - シェルが max-w-md で中央寄せされているので、シートも同じ幅に合わせて中央に置く。

export const BottomSheet = SheetPrimitive.Root;
export const BottomSheetTrigger = SheetPrimitive.Trigger;
export const BottomSheetClose = SheetPrimitive.Close;

export function BottomSheetContent({
  className,
  children,
  ...props
}: SheetPrimitive.Popup.Props) {
  return (
    <SheetPrimitive.Portal>
      <SheetPrimitive.Backdrop
        className='fixed inset-0 z-50 bg-[var(--overlay)] transition-opacity duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0'
        data-slot='bottom-sheet-overlay'
      />
      <SheetPrimitive.Popup
        className={cn(
          'v2-root fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[85dvh] w-full max-w-md flex-col gap-4 overflow-y-auto rounded-t-[20px] bg-popover px-4 pt-5 text-popover-foreground transition-transform duration-200 ease-out data-ending-style:translate-y-full data-starting-style:translate-y-full',
          className
        )}
        data-slot='bottom-sheet-content'
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 20px)' }}
        {...props}
      >
        {children}
      </SheetPrimitive.Popup>
    </SheetPrimitive.Portal>
  );
}

export function BottomSheetTitle({
  className,
  ...props
}: SheetPrimitive.Title.Props) {
  return (
    <SheetPrimitive.Title
      className={cn('font-bold text-xl', className)}
      data-slot='bottom-sheet-title'
      {...props}
    />
  );
}

export function BottomSheetDescription({
  className,
  ...props
}: SheetPrimitive.Description.Props) {
  return (
    <SheetPrimitive.Description
      className={cn('text-muted-foreground text-[13px]', className)}
      data-slot='bottom-sheet-description'
      {...props}
    />
  );
}
