'use client';

import { useMemo } from 'react';
import type {
  GroupedMethodList,
  GroupedTypeList,
  MethodCard,
  SubTypeCard,
  TypeCard
} from '../types';

// note フォーム（record / planned_record）が共有するカテゴリ・方法の候補導出。
//
// 収支（pay/income）・共有（self/pair）・立替で候補が入れ替わるため、選択中の値から
// 描画に必要な形を毎レンダで導出する。effect で追い掛けると前の候補が 1 フレーム残る。

export type TypeSelectionState = {
  isPay: boolean;
  typeId: number | null;
  subTypeId: number | null;
  isInstead: boolean;
};

export type TypeSelectionView = {
  types: TypeCard[];
  methods: MethodCard[];
  selectedType: TypeCard | null;
  subTypes: SubTypeCard[];
  hasSubType: boolean;
  isTypeChosen: boolean;
  showSubTypeGrid: boolean;
};

export function useTypeSelection(
  typeList: GroupedTypeList,
  methodList: GroupedMethodList,
  isPair: boolean,
  state: TypeSelectionState
): TypeSelectionView {
  const payKey = state.isPay ? 'pay' : 'income';
  const ownerKey = isPair ? 'pair' : 'self';
  const types = typeList[payKey][ownerKey];
  // 方法は立替時は自分の方法（self）、共有非立替は pair の方法。
  const methods =
    methodList[payKey][isPair && !state.isInstead ? 'pair' : 'self'];
  const selectedType = useMemo(
    () => types.find((type) => type.id === state.typeId) ?? null,
    [types, state.typeId]
  );
  const subTypes = selectedType?.subTypes ?? [];
  const hasSubType = subTypes.length > 0;
  return {
    types,
    methods,
    selectedType,
    subTypes,
    hasSubType,
    isTypeChosen:
      state.typeId !== null && (!hasSubType || state.subTypeId !== null),
    showSubTypeGrid:
      state.typeId !== null && hasSubType && state.subTypeId === null
  };
}
