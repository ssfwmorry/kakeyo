'use client';

import { useState } from 'react';
import { BottomSheet, BottomSheetContent } from '@/components/ui/bottom-sheet';
import type { NoteRecordDefault } from '@/features/record';
import { useTypeSelection } from '@/features/type-method';
import { pickLastUsedMethodId } from '../domain/last-used-method';
import { AmountStep } from './amount-step';
import type { NoteModalCandidates } from './note-modal';
import type { NoteState } from './note-state';
import { TypeStep } from './type-step';

// 入力の全画面モーダル。カテゴリ（入力①）と金額と詳細（入力②）を 1 つのシートの
// 中で切り替える。シートの上にシートを重ねると、スワイプで閉じる対象が曖昧になるため。
//
// 編集は②から始まり、ピルを押すと①に戻ってカテゴリを選び直せる。

export function RecordSheet({
  candidates,
  editing,
  initialDate,
  onClose,
  onSaved
}: {
  candidates: NoteModalCandidates;
  editing?: NoteRecordDefault;
  initialDate: string;
  onClose: () => void;
  onSaved?: () => void;
}) {
  const { typeList, methodList, lastUsedMethodIds, hasPair, today } =
    candidates;
  // 編集対象の共有／個人は対象自身の区分に従う（作成時に決まり後から移せない）。
  const isPair = editing?.isPair ?? candidates.isPair;

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
  const [isAmountStep, setIsAmountStep] = useState(editing !== undefined);
  const patch = (next: Partial<NoteState>) =>
    setState((prev) => ({ ...prev, ...next }));

  // 個人｜共有を切り替えるとカテゴリ・方法の候補ごと入れ替わるので、選択を捨てて
  // ①に戻す。render 中に前回値と比べて捨てる（effect では 1 フレーム残る）。
  const [prevIsPair, setPrevIsPair] = useState(isPair);
  if (prevIsPair !== isPair) {
    setPrevIsPair(isPair);
    setIsAmountStep(false);
    setState((prev) => ({
      ...prev,
      typeId: null,
      subTypeId: null,
      methodId: null,
      isInstead: true
    }));
  }

  const selection = useTypeSelection(typeList, methodList, isPair, state);
  const methodId = resolveMethodId({
    methods: selection.methods,
    selected: state.methodId,
    isEditing: editing !== undefined,
    lastUsed: pickLastUsedMethodId(lastUsedMethodIds, {
      isPay: state.isPay,
      isPair,
      isInstead: state.isInstead
    })
  });

  const goToAmount = (next: Partial<NoteState>) => {
    patch(next);
    setIsAmountStep(true);
  };
  const backToType = () => {
    setIsAmountStep(false);
    patch({ typeId: null, subTypeId: null });
  };
  const saved = () => {
    onSaved?.();
    onClose();
  };

  return (
    <BottomSheet onOpenChange={(isOpen) => !isOpen && onClose()} open>
      <BottomSheetContent
        // 原典のゴーストに重なる影。入力は画面を覆うので、地から浮いて見せる。
        className='shadow-[0_-8px_24px_rgba(0,0,0,0.18)]'
        size='full'
      >
        {isAmountStep && selection.selectedType !== null ? (
          <AmountStep
            editing={editing}
            isPair={isPair}
            methodId={methodId}
            methods={selection.methods}
            onBack={backToType}
            onClose={onClose}
            onSaved={saved}
            patch={patch}
            selectedType={selection.selectedType}
            state={state}
            today={today}
          />
        ) : (
          <TypeStep
            hasPair={hasPair}
            isPair={isPair}
            // 共有か個人かは作成時に決まり後から移せないので、編集中は切り替えさせない。
            isPairLocked={editing !== undefined}
            isPay={state.isPay}
            onClose={onClose}
            onPayChange={(isPay) =>
              // 収支が変わるとカテゴリ候補ごと入れ替わるため、選択済みのカテゴリを捨てる。
              patch({ isPay, typeId: null, subTypeId: null, methodId: null })
            }
            onPick={(typeId, subTypeId) => goToAmount({ typeId, subTypeId })}
            types={selection.types}
          />
        )}
      </BottomSheetContent>
    </BottomSheet>
  );
}

// 候補に対して選択中の方法を解決する。未選択なら前回使った方法、それも候補に無ければ
// 候補の先頭（＝設定画面の並び順の先頭）で埋める。描画のたびに導出する
// （effect だと前の候補が 1 フレーム残る）。
//
// 編集中の記録が持つ方法が候補外のとき（記録の所有と共有モードが食い違う場合に起きる）は
// 先頭で埋めず未選択にする。黙って別の方法に置き換えると、ユーザーが方法を触っていないのに
// 保存済みの値が書き換わるため。未選択は送信ボタン側が止める。
function resolveMethodId({
  methods,
  selected,
  isEditing,
  lastUsed
}: {
  methods: { id: number }[];
  selected: number | null;
  isEditing: boolean;
  lastUsed: number | null;
}): number | null {
  const has = (id: number | null) =>
    id !== null && methods.some((method) => method.id === id);
  if (has(selected)) {
    return selected;
  }
  if (isEditing && selected !== null) {
    return null;
  }
  if (has(lastUsed)) {
    return lastUsed;
  }
  return methods[0]?.id ?? null;
}
