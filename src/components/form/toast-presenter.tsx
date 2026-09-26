'use client';

import { createContext, type ReactNode, useContext } from 'react';
import { toast } from 'sonner';
import type { ToastMessage } from '@/lib/shared/types/formResult';

// FormActionResult.toast を実際に画面へ出す関数（presenter）。
//
// 出し方（種類ごとの表示時間・同時に 1 枚）は AppToaster が決める。useFormToast の
// 呼び出し側は多く、画面ごとに出し方を渡して回るより、レイアウトが 1 箇所で差し替える
// ほうが漏れない。そのため context で配り、既定は sonner の素の呼び出しにしておく。

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
