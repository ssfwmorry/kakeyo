// type-method feature の公開 API（barrel）。
// server-only（repositories / services / actions）は re-export しない。
// 公開するのは入力フロー（record / planned_record）が共有するカテゴリ選択の状態フックと FE 型。
// データは @/features/type-method/server/services から直接 import して使う。
// server-only（repositories / services / actions）は re-export しない。
// 公開するのは設定タブの Client Component と FE 型のみ。
// setting 統合は getTypeCardList / getMethodCardList を
// @/features/type-method/server/services から直接 import して使う。

export {
  type TypeSelectionState,
  type TypeSelectionView,
  useTypeSelection
} from './components/use-type-selection';
export type {
  GroupedMethodList,
  GroupedTypeList,
  MethodCard,
  SubTypeCard,
  TypeCard
} from './types';
