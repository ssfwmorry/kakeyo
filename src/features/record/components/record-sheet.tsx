'use client';

import { useState } from 'react';
import { BottomSheet, BottomSheetContent } from '@/components/ui/bottom-sheet';
import type { NoteRecordDefault } from '@/features/record';
import { useTypeSelection } from '@/features/type-method';
import { resolveMethodId } from '../domain/method-order';
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
  onSaved,
  today
}: {
  candidates: NoteModalCandidates;
  editing?: NoteRecordDefault;
  initialDate: string;
  onClose: () => void;
  onSaved?: () => void;
  today: string;
}) {
  const { typeList, methodList, hasPair } = candidates;
  // 個人／共有はシートの中で移せる。初期値は編集なら対象の区分、新規は今のモード。
  const [isPair, setIsPair] = useState(editing?.isPair ?? candidates.isPair);

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

  // カテゴリ・方法は個人用と共有用が別レコードで横断できないため、切り替えたら
  // 捨てて①へ戻す。金額・日付・メモは残す（間違えた区分で作ったものを、
  // 消さずに移せるようにするため）。
  const changeIsPair = (next: boolean) => {
    if (next === isPair) {
      return;
    }
    setIsPair(next);
    setIsAmountStep(false);
    setState((prev) => ({
      ...prev,
      typeId: null,
      subTypeId: null,
      methodId: null,
      isInstead: true
    }));
  };

  const selection = useTypeSelection(typeList, methodList, isPair, state);
  const methodId = resolveMethodId({
    methods: selection.methods,
    selected: state.methodId,
    isEditing: editing !== undefined
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
            hasPair={hasPair}
            isPair={isPair}
            isPairLocked={editing?.isScopeLocked ?? false}
            methodId={methodId}
            methods={selection.methods}
            onBack={backToType}
            onClose={onClose}
            onPairChange={changeIsPair}
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
            isPairLocked={editing?.isScopeLocked ?? false}
            onPairChange={changeIsPair}
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
