// plan-reminder feature の公開 API（barrel）。
// server-only（repositories / services / actions / demo）は re-export しない
// （FE から誤 import されるとビルドが壊れる）。公開するのは画面 Client Component と
// FE 型のみ。
// - plan 画面ルート（app/(private)/plan/page.tsx）が PlanScreen を使う。
// - setting 統合（P5）は PlanSettingTab を配置し、データは
//   @/features/plan-reminder/server/services から直接 import して取得する。

export { PlanScreen } from './components/plan-screen';
export { PlanSettingTab } from './components/plan-setting-tab';
export { PlanTypeTab } from './components/plan-type-tab';
export { ReminderTab } from './components/reminder-tab';
export type {
  GroupedPlanTypeList,
  GroupedReminderList,
  PlanItem,
  PlanReminderError,
  PlanTypeCard,
  ReminderItem
} from './types';
