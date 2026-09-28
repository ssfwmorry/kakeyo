'use client';

import type { ReactNode } from 'react';
import { Toaster } from 'sonner';
import { ToastPresenterProvider } from '@/components/form/toast-presenter';
import { IconAlertCircle, IconCheck, IconClose } from '@/components/icons';
import { SUCCESS_DURATION, showToast } from '@/lib/shared/toast/show-toast';

// トースト（原典 Toast.dc.html）。画面上端のステータスバー直下に、
// 左右 16px を空けて幅いっぱいに出す。シート・暗幕・確認アラートより手前。
//
// sonner の Toaster を unstyled にして、種類ごとの色とアイコンをここで描く。
// こうしておくと、useFormToast 経由でも FlashToast 経由でも同じ見た目になる。
// 表示時間と置き換えは showToast が決め、useFormToast には presenter として配る。
//
// 地の色はライト・ダークで変えない。完了の黒（#16191A）はダークの面と同じ
// 明るさで、エラーの赤は白文字が読める側の値を固定にする。影は D17 の例外。
//
// 幅と位置は inline で上書きしている。sonner は 600px 以下で幅 100% に切り替える
// が、このアプリはシェル幅（max-w-md）で固定なので、その内側 16px に揃える。

const TOP = 'calc(env(safe-area-inset-top) + 7px)';

const TOAST_CLASS =
  'flex w-full items-center gap-2.5 rounded-[14px] px-4 py-3 font-semibold text-[15px] text-white leading-[1.4] shadow-[0_8px_24px_rgba(22,25,26,0.28)] outline-none';
const SUCCESS_CLASS = 'bg-[#16191a]';
const ERROR_CLASS = 'bg-[#c4372b]';

function SuccessIcon() {
  return (
    <span className='flex size-[22px] items-center justify-center rounded-full bg-primary'>
      <IconCheck className='size-[13px] text-white' strokeWidth={3} />
    </span>
  );
}

function ErrorIcon() {
  return (
    <IconAlertCircle className='size-[22px] text-white' strokeWidth={2.2} />
  );
}

export function AppToaster({ children }: { children: ReactNode }) {
  return (
    <ToastPresenterProvider present={showToast}>
      {children}
      <Toaster
        closeButton
        duration={SUCCESS_DURATION}
        icons={{
          success: <SuccessIcon />,
          info: <SuccessIcon />,
          error: <ErrorIcon />,
          warning: <ErrorIcon />,
          close: <IconClose className='size-3.5' strokeWidth={2.6} />
        }}
        mobileOffset={{ top: TOP, left: 0, right: 0 }}
        offset={{ top: TOP }}
        position='top-center'
        style={{
          left: '50%',
          right: 'auto',
          transform: 'translateX(-50%)',
          width: 'min(calc(100vw - 32px), calc(28rem - 32px))'
        }}
        toastOptions={{
          unstyled: true,
          closeButtonAriaLabel: '閉じる',
          classNames: {
            toast: TOAST_CLASS,
            success: SUCCESS_CLASS,
            info: SUCCESS_CLASS,
            error: ERROR_CLASS,
            warning: ERROR_CLASS,
            icon: 'flex shrink-0',
            content: 'min-w-0 flex-1',
            // sonner は × を先頭に描くので、順序で右端へ送る。
            closeButton:
              '-mr-1.5 order-last flex size-7 shrink-0 items-center justify-center rounded-full text-white/70'
          }
        }}
        visibleToasts={1}
      />
    </ToastPresenterProvider>
  );
}
