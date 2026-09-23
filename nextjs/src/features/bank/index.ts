// bank feature の公開 API（barrel）。
// server-only（services / repositories / actions）は re-export しない。
// 公開するのは bank 画面本体（残高の閲覧・登録）と、設定画面に置く口座マスタの設定タブの
// Client Component と FE 型のみ。actions は Client Component が直接 import する。
// 口座マスタの管理 UI（BankSettingTab）は設定画面（/setting）専用で、bank 画面には置かない。
// setting 統合側は getBankList を @/features/bank/server/services から直接 import する。

export { BankScreen } from './components/bank-screen';
export { BankSettingTab } from './components/bank-setting-tab';
export type {
  BalanceChartPoint,
  BankItem,
  BankScreenData,
  TableRow
} from './types';
