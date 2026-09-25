'use client';

import { Drawer } from '@base-ui/react/drawer';
import { cn } from 'cn';
import type { ReactNode } from 'react';

// 下から出るシート。新デザインでは Dialog を全てこれに置き換える
// （デザイン基礎「Dialog はすべて下から出るシートに置き換える」）。
//
// Base UI の Drawer を使う。swipeDirection の既定が 'down' なので、下スワイプで閉じる。
// 上端のグラバー（掴み棒）はデザインにある 36×5px の棒で、「掴んで下げられる」ことの
// 手がかりとして出す。
//
// 地は面（白）ではなく画面の地色。シートの中に白いカードを積む構成なので、
// 地が白だとカードが沈む。
//
// 高さは 2 種類（docs/new-design/共通仕様.md「ボトムシート」）:
// - content: 内容に応じた高さ。上限は画面の 94% で、超えた分は内側でスクロールする。
// - full: 上端 56px を残して画面下端まで固定。入力フローのようにテンキーを下に
//   張り付ける画面が使う。内側はスクロールさせず、中身が flex で縦に並ぶ。
//
// footer は下端に張り付く帯（予定シートの保存ボタンなど）。スクロール領域の外に置き、
// 中身が長くても常に見える。フォームの送信ボタンを置くときは form 属性でフォームに結ぶ。
//
// Portal で body 直下に出るため、トークンを効かせるために v2-root を付け直している。

export const BottomSheet = Drawer.Root;
export const BottomSheetTrigger = Drawer.Trigger;
export const BottomSheetClose = Drawer.Close;

export function BottomSheetContent({
  className,
  children,
  size = 'content',
  gap = 14,
  footer,
  ...props
}: Drawer.Popup.Props & {
  size?: 'content' | 'full';
  // 中身の縦の間隔。設定系のシートは 12、それ以外は 14（デザイン各シート）。
  gap?: 12 | 14;
  footer?: ReactNode;
}) {
  const isFull = size === 'full';
  const hasFooter = footer !== undefined;
  return (
    <Drawer.Portal>
      {/* 暗幕も Portal で body 直下に出るので、--overlay を引くために v2-root が要る。 */}
      <Drawer.Backdrop className='v2-root fixed inset-0 z-50 bg-[var(--overlay)] transition-opacity duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0' />
      <Drawer.Viewport className='fixed inset-0 z-50 flex items-end justify-center'>
        <Drawer.Popup
          className={cn(
            // シェルと同じ幅に収める。PC 幅で画面いっぱいに広がらないようにする。
            'v2-root flex w-full max-w-md flex-col rounded-t-[20px] bg-background text-foreground',
            isFull ? 'h-[calc(100dvh-56px)]' : 'max-h-[94dvh]',
            className
          )}
          data-slot='bottom-sheet-content'
          {...props}
        >
          {/* 掴み棒。押し下げて閉じられることの手がかり。 */}
          <div
            aria-hidden='true'
            className='mx-auto mt-2 h-[5px] w-9 shrink-0 rounded-full bg-grabber'
          />
          <Drawer.Content
            className={cn(
              'flex min-h-0 flex-1 flex-col px-4 pt-2',
              gap === 12 ? 'gap-3' : 'gap-3.5',
              isFull ? 'overflow-hidden' : 'overflow-y-auto',
              hasFooter && 'pb-1'
            )}
            style={
              isFull || hasFooter
                ? undefined
                : { paddingBottom: 'max(env(safe-area-inset-bottom), 34px)' }
            }
          >
            {children}
          </Drawer.Content>
          {hasFooter ? (
            <div
              className='shrink-0 border-t bg-background px-4 pt-3'
              style={{
                paddingBottom: 'max(env(safe-area-inset-bottom), 34px)'
              }}
            >
              {footer}
            </div>
          ) : null}
        </Drawer.Popup>
      </Drawer.Viewport>
    </Drawer.Portal>
  );
}

export function BottomSheetTitle({ className, ...props }: Drawer.Title.Props) {
  return (
    <Drawer.Title
      className={cn('font-semibold text-[17px]', className)}
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
