'use client';

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState
} from 'react';
import type { LastUsedMethodIds, NoteRecordDefault } from '@/features/record';
import type {
  GroupedMethodList,
  GroupedTypeList
} from '@/features/type-method';
import { RecordSheet } from './record-sheet';

// 入力の全画面モーダル（README D1）。タブバーの ＋ はどのタブからでも入力を開き、
// 閉じると元のタブに戻る。そのため開閉の状態を (private)/layout.tsx の Context に置き、
// 候補データ（カテゴリ・方法・前回の方法）も layout で 1 度だけ取って配る。

export type NoteModalCandidates = {
  typeList: GroupedTypeList;
  methodList: GroupedMethodList;
  lastUsedMethodIds: LastUsedMethodIds;
  isPair: boolean;
  hasPair: boolean;
  today: string;
};

type OpenOptions = {
  // 編集対象。省略すると新規。
  editing?: NoteRecordDefault;
  // 新規の初期日付（カレンダーの選択日）。省略すると今日。
  initialDate?: string;
  // 保存・削除が成功したとき。開いた画面が自分の state を更新するために使う。
  onSaved?: () => void;
};

type NoteModalContextValue = {
  open: (options?: OpenOptions) => void;
  close: () => void;
};

const NoteModalContext = createContext<NoteModalContextValue | null>(null);

export function useNoteModal(): NoteModalContextValue {
  const value = useContext(NoteModalContext);
  if (value === null) {
    throw new Error('NoteModalProvider の外で useNoteModal は使えません');
  }
  return value;
}

type SheetState = { key: number; options: OpenOptions } | null;

export function NoteModalProvider({
  candidates,
  children
}: {
  candidates: NoteModalCandidates;
  children: ReactNode;
}) {
  const [sheet, setSheet] = useState<SheetState>(null);

  // key を変えて開くたびにシートを作り直す。入力中の値はシート側の state なので、
  // 同じ要素を使い回すと前回の入力が残る。
  const open = useCallback((options: OpenOptions = {}) => {
    setSheet((prev) => ({ key: (prev?.key ?? 0) + 1, options }));
  }, []);
  const close = useCallback(() => setSheet(null), []);
  const value = useMemo(() => ({ open, close }), [open, close]);

  return (
    <NoteModalContext.Provider value={value}>
      {/* 背面の画面はモーダル中だけ縮めて奥に退ける（原典のゴースト）。 */}
      <div
        className='flex min-h-0 flex-1 flex-col overflow-hidden transition-[transform,opacity,border-radius] duration-200 data-[modal=open]:rounded-[14px] data-[modal=open]:opacity-50'
        data-modal={sheet === null ? undefined : 'open'}
        style={sheet === null ? undefined : { transform: 'scale(0.95)' }}
      >
        {children}
      </div>
      {sheet === null ? null : (
        <RecordSheet
          candidates={candidates}
          editing={sheet.options.editing}
          initialDate={sheet.options.initialDate ?? candidates.today}
          key={sheet.key}
          onClose={close}
          onSaved={sheet.options.onSaved}
        />
      )}
    </NoteModalContext.Provider>
  );
}
