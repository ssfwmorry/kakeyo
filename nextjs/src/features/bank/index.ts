// bank feature の公開 API（barrel）。
// server-only（services / repositories / actions）は re-export しない
// （FE から誤 import されるとビルドが壊れる）。公開するのは bank 画面本体・設定タブの
// Client Component と FE 型のみ。actions は Client Component が直接 import する。
// setting 統合側は getBankScreenData を @/features/bank/server/services から直接 import する。

export { BankScreen } from './components/bank-screen';
export { BankSettingTab } from './components/bank-setting-tab';
export type {
  BalanceChartPoint,
  BankItem,
  BankScreenData,
  TableRow
} from './types';
