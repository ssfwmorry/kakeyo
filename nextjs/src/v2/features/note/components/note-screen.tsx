'use client';

import { useState } from 'react';
import type { ShortCutItem } from '@/features/memo-shortcut';
import type {
  GroupedMethodList,
  GroupedTypeList
} from '@/features/type-method';
import { useTypeSelection } from '@/features/type-method';
import { isInsteadShortcut, selectShortcutsForMode } from '../domain/shortcut';
import { AmountStep } from './amount-step';
import type { NoteState } from './note-state';
import { TypeStep } from './type-step';

// 入力フロー（新デザイン）。カテゴリを選ぶ 1 枚目と、金額と詳細の 2 枚目を 1 つの
// ルートで持ち、どちらを出すかは選択の状態で決める。URL を分けないのは、
// 1 枚目の選択を 2 枚目へ持ち越す必要があり、戻ったときに選び直せればよいため。
//
// カテゴリと方法の候補の導出は旧フォームと同じ useTypeSelection を使う。
// ただし「サブカテゴリがあれば必ず選ぶ」という旧の確定条件は使わず、
// 2 枚目に進んだかどうかを自分で持つ（新デザインはサブカテゴリを飛ばせる）。

export function NoteScreen({
  typeList,
  methodList,
  shortcuts,
  isPair,
  initialDate,
  today
}: {
  typeList: GroupedTypeList;
  methodList: GroupedMethodList;
  shortcuts: ShortCutItem[];
  isPair: boolean;
  // 新規の初期日付。カレンダーの選択日から来たときはその日、それ以外は今日。
  initialDate: string;
  today: string;
}) {
  const [state, setState] = useState<NoteState>(() => ({
    isPay: true,
    date: initialDate,
    typeId: null,
    subTypeId: null,
    methodId: null,
    isInstead: true,
    memo: '',
    price: 0
  }));
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const patch = (next: Partial<NoteState>) =>
    setState((prev) => ({ ...prev, ...next }));

  // 個人｜共有を切り替えるとカテゴリ・方法の候補ごと入れ替わるので、選択を捨てて
  // 1 枚目に戻す。render 中に前回値と比べて捨てる（effect では 1 フレーム残る）。
  const [prevIsPair, setPrevIsPair] = useState(isPair);
  if (prevIsPair !== isPair) {
    setPrevIsPair(isPair);
    setIsDetailOpen(false);
    setState((prev) => ({
      ...prev,
      typeId: null,
      subTypeId: null,
      methodId: null,
      isInstead: true
    }));
  }

  const view = useTypeSelection(typeList, methodList, isPair, state);
  // 未選択なら先頭を初期値にする。先頭 = 設定画面の並び順なので、よく使う方法を
  // 上に置けば 1 タップも要らない。描画のたびに導出する（effect だと旧候補が残る）。
  const methodId =
    state.methodId !== null &&
    view.methods.some((method) => method.id === state.methodId)
      ? state.methodId
      : (view.methods[0]?.id ?? null);

  const openDetail = (next: Partial<NoteState>) => {
    patch(next);
    setIsDetailOpen(true);
  };

  if (isDetailOpen && view.selectedType !== null) {
    return (
      <AmountStep
        isPair={isPair}
        methodId={methodId}
        methods={view.methods}
        onBack={() => {
          setIsDetailOpen(false);
          patch({ typeId: null, subTypeId: null });
        }}
        patch={patch}
        selectedType={view.selectedType}
        state={state}
        today={today}
      />
    );
  }

  return (
    <TypeStep
      isPair={isPair}
      isPay={state.isPay}
      onPayChange={(isPay) =>
        // 収支が変わるとカテゴリ候補ごと入れ替わるため、選択済みのカテゴリを捨てる。
        patch({ isPay, typeId: null, subTypeId: null, methodId: null })
      }
      onPickShortcut={(item) =>
        openDetail({
          isPay: item.isPay,
          typeId: item.typeId,
          subTypeId: item.subTypeId,
          methodId: item.methodId,
          isInstead: isInsteadShortcut(item),
          memo: item.memo ?? '',
          price: item.price
        })
      }
      onPickType={(typeId, subTypeId) => openDetail({ typeId, subTypeId })}
      shortcuts={selectShortcutsForMode(shortcuts, isPair)}
      types={view.types}
    />
  );
}
