'use client';

import { createContext, type ReactNode, useContext } from 'react';
import { toast } from 'sonner';
import type { ToastMessage } from '@/lib/shared/types/formResult';

// FormActionResult.toast を実際に画面へ出す関数（presenter）。
//
// 旧画面と新デザインでトーストの出し方が違う（新デザインは種類ごとに表示時間が
// 変わり、同時に 1 枚だけ出す）。useFormToast の呼び出し側は多く、画面ごとに
// 出し方を渡して回るより、レイアウトが 1 箇所で差し替えるほうが漏れない。
// そのため context で配り、既定は sonner の素の呼び出しにしておく。

export type ToastPresenter = (message: ToastMessage) => void;

const presentWithSonner: ToastPresenter = ({ type, message }) => {
  toast[type](message);
};

const ToastPresenterContext = createContext<ToastPresenter>(presentWithSonner);

export function ToastPresenterProvider({
  present,
  children
}: {
  present: ToastPresenter;
  children: ReactNode;
}) {
  return (
    <ToastPresenterContext.Provider value={present}>
      {children}
    </ToastPresenterContext.Provider>
  );
}

export function useToastPresenter(): ToastPresenter {
  return useContext(ToastPresenterContext);
}
