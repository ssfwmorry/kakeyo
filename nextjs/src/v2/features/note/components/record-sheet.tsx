'use client';

import { useState } from 'react';
import type { ShortCutItem } from '@/features/memo-shortcut';
import type { NoteRecordDefault } from '@/features/record';
import type {
  GroupedMethodList,
  GroupedTypeList,
  TypeCard
} from '@/features/type-method';
import { useTypeSelection } from '@/features/type-method';
import {
  BottomSheet,
  BottomSheetContent
} from '@/v2/components/ui/bottom-sheet';
import { isInsteadShortcut, selectShortcutsForMode } from '../domain/shortcut';
import { AmountStep } from './amount-step';
import type { NoteState } from './note-state';
import { SubTypeStep } from './sub-type-step';
import { TypeStep } from './type-step';

// 記録の追加・編集シート（新デザイン）。カレンダーの上に下から出る。
//
// カテゴリ（1 枚目）→ サブカテゴリ（2 枚目）→ 金額と詳細（3 枚目）を 1 つのシートの
// 中で切り替える。シートの上にシートを重ねると、スワイプで閉じる対象が曖昧になるため。
//
// カテゴリと方法の候補の導出は旧フォームと同じ useTypeSelection を使う。
// ただし「サブカテゴリがあれば必ず選ぶ」という旧の確定条件は使わず、
// どの画面にいるかを自分で持つ（新デザインはサブカテゴリを飛ばせる）。
//
// 編集は 3 枚目から始まり、ピルを押すと 1 枚目に戻ってカテゴリを選び直せる。

type View =
  | { kind: 'type' }
  | { kind: 'sub'; type: TypeCard }
  | { kind: 'amount' };

export function RecordSheet({
  typeList,
  methodList,
  shortcuts,
  isPair,
  hasPair,
  editing,
  initialDate,
  today,
  onOpenChange,
  onSaved
}: {
  typeList: GroupedTypeList;
  methodList: GroupedMethodList;
  shortcuts: ShortCutItem[];
  isPair: boolean;
  hasPair: boolean;
  // 編集対象。新規のときは undefined。
  editing?: NoteRecordDefault;
  // 新規の初期日付（カレンダーの選択日）。
  initialDate: string;
  today: string;
  onOpenChange: (isOpen: boolean) => void;
  // 登録・更新・削除が成功したとき。呼び出し側で月を取り直す。
  onSaved: () => void;
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
  const [view, setView] = useState<View>(
    editing === undefined ? { kind: 'type' } : { kind: 'amount' }
  );
  const patch = (next: Partial<NoteState>) =>
    setState((prev) => ({ ...prev, ...next }));

  // 個人｜共有を切り替えるとカテゴリ・方法の候補ごと入れ替わるので、選択を捨てて
  // 1 枚目に戻す。render 中に前回値と比べて捨てる（effect では 1 フレーム残る）。
  const [prevIsPair, setPrevIsPair] = useState(isPair);
  if (prevIsPair !== isPair) {
    setPrevIsPair(isPair);
    setView({ kind: 'type' });
    setState((prev) => ({
      ...prev,
      typeId: null,
      subTypeId: null,
      methodId: null,
      isInstead: true
    }));
  }

  const selection = useTypeSelection(typeList, methodList, isPair, state);
  const methodId = resolveMethodId(
    selection.methods,
    state.methodId,
    editing !== undefined
  );

  const openAmount = (next: Partial<NoteState>) => {
    patch(next);
    setView({ kind: 'amount' });
  };
  const backToType = () => {
    setView({ kind: 'type' });
    patch({ typeId: null, subTypeId: null });
  };
  const close = () => onOpenChange(false);
  const saved = () => {
    onSaved();
    close();
  };

  return (
    <BottomSheet onOpenChange={onOpenChange} open>
      <BottomSheetContent className='max-h-[94dvh]'>
        {view.kind === 'type' ? (
          <TypeStep
            hasPair={hasPair}
            isPair={isPair}
            // 共有か個人かは作成時に決まり後から移せないので、編集中は切り替えさせない。
            isPairLocked={editing !== undefined}
            isPay={state.isPay}
            onCancel={close}
            onPayChange={(isPay) =>
              // 収支が変わるとカテゴリ候補ごと入れ替わるため、選択済みのカテゴリを捨てる。
              patch({ isPay, typeId: null, subTypeId: null, methodId: null })
            }
            onPickShortcut={(item) =>
              openAmount({
                isPay: item.isPay,
                typeId: item.typeId,
                subTypeId: item.subTypeId,
                methodId: item.methodId,
                isInstead: isInsteadShortcut(item),
                memo: item.memo ?? '',
                price: item.price
              })
            }
            onPickType={(type) => {
              if (type.subTypes.length === 0) {
                openAmount({ typeId: type.id, subTypeId: null });
                return;
              }
              patch({ typeId: type.id, subTypeId: null });
              setView({ kind: 'sub', type });
            }}
            // 編集中に「いつもの」を押すと、金額やメモまで別の記録の内容で上書きされる。
            // 編集はカテゴリを選び直すだけの画面なので出さない。
            shortcuts={
              editing === undefined
                ? selectShortcutsForMode(shortcuts, isPair)
                : []
            }
            title={editing === undefined ? '記録を追加' : '記録を編集'}
            types={selection.types}
          />
        ) : null}

        {view.kind === 'sub' ? (
          <SubTypeStep
            onBack={backToType}
            onPick={(subTypeId) => openAmount({ subTypeId })}
            type={view.type}
          />
        ) : null}

        {view.kind === 'amount' && selection.selectedType !== null ? (
          <AmountStep
            editingId={editing?.id}
            isPair={isPair}
            methodId={methodId}
            methods={selection.methods}
            onBack={backToType}
            onCancel={close}
            onSaved={saved}
            patch={patch}
            selectedType={selection.selectedType}
            state={state}
            today={today}
          />
        ) : null}
      </BottomSheetContent>
    </BottomSheet>
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
