// type-method feature の公開 API（barrel）。
// server-only（repositories / services / actions / demo）は re-export しない
// （FE から誤 import されるとビルドが壊れる）。公開するのは設定タブの
// Client Component と FE 型のみ。
// P5 の setting 統合は getTypeCardList / getMethodCardList を
// @/features/type-method/server/services から直接 import して使う。

export { KakeiMethod } from './components/kakei-method';
export { KakeiType } from './components/kakei-type';
export type {
  GroupedMethodList,
  GroupedTypeList,
  MethodCard,
  SubTypeCard,
  TypeCard
} from './types';
