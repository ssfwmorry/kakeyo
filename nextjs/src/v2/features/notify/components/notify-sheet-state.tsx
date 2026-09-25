'use client';

import {
  createContext,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  useContext,
  useState
} from 'react';

// お知らせシートの開閉状態。
//
// 通常はベル（NotificationBellButton）が自分で持つが、カレンダーでは日別リストの
// リマインダー行からも開く。ベルと行は画面の別々の場所にあるので、画面側が
// この Provider で状態を持ち、両方から同じシートを開けるようにする。
// Provider が無い画面（設定）ではベルが自前の state に戻る。

type SheetState = [boolean, Dispatch<SetStateAction<boolean>>];

const NotifySheetStateContext = createContext<SheetState | null>(null);

export function NotifySheetStateProvider({
  children
}: {
  children: ReactNode;
}) {
  const state = useState(false);
  return (
    <NotifySheetStateContext.Provider value={state}>
      {children}
    </NotifySheetStateContext.Provider>
  );
}

// ベルが使う。Provider があればその状態、無ければ自前の状態。
export function useNotifySheetState(): SheetState {
  const shared = useContext(NotifySheetStateContext);
  const local = useState(false);
  return shared ?? local;
}

// リマインダー行など、ベル以外からシートを開くときに使う。Provider が無ければ null。
export function useOpenNotifySheet(): (() => void) | null {
  const shared = useContext(NotifySheetStateContext);
  if (shared === null) {
    return null;
  }
  const [, setIsOpen] = shared;
  return () => setIsOpen(true);
}
