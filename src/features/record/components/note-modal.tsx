'use client';

import {
  createContext,
  type ReactNode,
  Suspense,
  use,
  useCallback,
  useContext,
  useMemo,
  useState
} from 'react';
import type { NoteRecordDefault } from '@/features/record';
import type {
  GroupedMethodList,
  GroupedTypeList
} from '@/features/type-method';
import { todayJst } from '@/lib/shared/domain/date';
import { RecordSheet } from './record-sheet';

// 入力の全画面モーダル（README D1）。タブバーの ＋ はどのタブからでも入力を開き、
// 閉じると元のタブに戻る。そのため開閉の状態を (private)/layout.tsx の Context に置き、
// 候補データ（カテゴリ・方法）も layout で 1 度だけ取って配る。
//
// 候補は解決済みの値ではなく Promise で受け、シートを開いたときに初めて use() で
// 読む（layout が await するとシェルごと待たされるため）。
// 既定日の「今日」は開いた瞬間にクライアントで計算する。サーバで決めるとシェルの
// 事前描画がそこで止まり、開きっぱなしの PWA では日付跨ぎで前日が既定になる。
// デモだけは基準日に固定するので上書き値を受ける。

export type NoteModalCandidates = {
  typeList: GroupedTypeList;
  methodList: GroupedMethodList;
  isPair: boolean;
  hasPair: boolean;
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

type SheetState = { key: number; options: OpenOptions; today: string } | null;

export function NoteModalProvider({
  candidates,
  children,
  demoToday
}: {
  candidates: Promise<NoteModalCandidates>;
  children: ReactNode;
  demoToday: string | null;
}) {
  const [sheet, setSheet] = useState<SheetState>(null);

  // key を変えて開くたびにシートを作り直す。入力中の値はシート側の state なので、
  // 同じ要素を使い回すと前回の入力が残る。
  const open = useCallback(
    (options: OpenOptions = {}) => {
      const today = demoToday ?? todayJst();
      setSheet((prev) => ({ key: (prev?.key ?? 0) + 1, options, today }));
    },
    [demoToday]
  );
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
        <Suspense fallback={<RecordSheetSkeleton />} key={sheet.key}>
          <ResolvedRecordSheet
            candidatesPromise={candidates}
            editing={sheet.options.editing}
            initialDate={sheet.options.initialDate ?? sheet.today}
            onClose={close}
            onSaved={sheet.options.onSaved}
            today={sheet.today}
          />
        </Suspense>
      )}
    </NoteModalContext.Provider>
  );
}

// 候補が未解決のまま開いたときだけ出る繋ぎ。シートは全高固定で形が決まっているので、
// 骨格（グラバー・ヘッダ）を出しても嘘にならない。
function RecordSheetSkeleton() {
  return (
    <div className='fixed inset-x-0 bottom-0 top-14 z-50 mx-auto flex w-full max-w-md flex-col rounded-t-[14px] bg-background shadow-[0_-8px_24px_rgba(0,0,0,0.18)]'>
      <div className='mx-auto mt-2 h-1 w-9 rounded-full bg-fill-soft' />
    </div>
  );
}

function ResolvedRecordSheet({
  candidatesPromise,
  editing,
  initialDate,
  onClose,
  onSaved,
  today
}: {
  candidatesPromise: Promise<NoteModalCandidates>;
  editing?: NoteRecordDefault;
  initialDate: string;
  onClose: () => void;
  onSaved?: () => void;
  today: string;
}) {
  return (
    <RecordSheet
      candidates={use(candidatesPromise)}
      editing={editing}
      initialDate={initialDate}
      onClose={onClose}
      onSaved={onSaved}
      today={today}
    />
  );
}
