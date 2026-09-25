'use client';

import { useState } from 'react';
import type { ShortCutItem } from '@/features/memo-shortcut';
import type { NoteRecordDefault } from '@/features/record';
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
//
// 記録の編集（デザイン RecordEdit）も同じ画面で持つ。編集は 2 枚目から始まり、
// ピルを押すと 1 枚目に戻ってカテゴリを選び直せる。

export function NoteScreen({
  typeList,
  methodList,
  shortcuts,
  isPair,
  editing,
  initialDate,
  today
}: {
  typeList: GroupedTypeList;
  methodList: GroupedMethodList;
  shortcuts: ShortCutItem[];
  isPair: boolean;
  // 編集対象。新規のときは undefined。
  editing?: NoteRecordDefault;
  // 新規の初期日付。カレンダーの選択日から来たときはその日、それ以外は今日。
  initialDate: string;
  today: string;
}) {
  const [state, setState] = useState<NoteState>(() => ({
    isPay: editing?.isPay ?? true,
    date: editing?.date ?? initialDate,
    typeId: editing?.typeId ?? null,
    subTypeId: editing?.subTypeId ?? null,
    methodId: editing?.methodId ?? null,
    isInstead: editing?.isInstead ?? true,
    memo: editing?.memo ?? '',
    price: editing?.price ?? 0
  }));
  // 編集はカテゴリが決まっているので 2 枚目から。精算など type を持たない記録は 1 枚目から。
  const [isDetailOpen, setIsDetailOpen] = useState(
    editing !== undefined && editing.typeId !== null
  );
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
  const methodId = resolveMethodId(
    view.methods,
    state.methodId,
    editing !== undefined
  );

  const openDetail = (next: Partial<NoteState>) => {
    patch(next);
    setIsDetailOpen(true);
  };

  if (isDetailOpen && view.selectedType !== null) {
    return (
      <AmountStep
        editingId={editing?.id}
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
      // 共有か個人かは作成時に決まり後から移せないので、編集中は切り替えさせない。
      isPairLocked={editing !== undefined}
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
      // 編集中に「いつもの」を押すと、金額やメモまで別の記録の内容で上書きされる。
      // 編集はカテゴリを選び直すだけの画面なので出さない。
      shortcuts={
        editing === undefined ? selectShortcutsForMode(shortcuts, isPair) : []
      }
      types={view.types}
    />
  );
}

// 候補に対して選択中の方法を解決する。未選択なら先頭を初期値にする。先頭 = 設定画面の
// 並び順なので、よく使う方法を上に置けば 1 タップも要らない。描画のたびに導出する
// （effect だと旧候補が 1 フレーム残る）。
//
// 編集中の記録が持つ方法が候補外のとき（記録の所有と共有モードが食い違う場合に起きる）は
// 先頭で埋めず未選択にする。黙って別の方法に置き換えると、ユーザーが方法を触っていないのに
// 保存済みの値が書き換わるため。未選択は送信ボタン側が止める。
function resolveMethodId(
  methods: { id: number }[],
  methodId: number | null,
  isEditing: boolean
): number | null {
  if (methodId !== null && methods.some((method) => method.id === methodId)) {
    return methodId;
  }
  if (isEditing && methodId !== null) {
    return null;
  }
  return methods[0]?.id ?? null;
}
