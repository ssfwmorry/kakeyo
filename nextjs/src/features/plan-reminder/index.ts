// plan-reminder feature の公開 API（barrel）。
// server-only（repositories / services / actions / demo）は re-export しない。
// 公開するのは画面 Client Component と FE 型のみ。
// - plan 画面ルート（app/(private)/plan/page.tsx）が PlanScreen を使う。
// - setting 統合は PlanSettingTab を配置し、データは
//   @/features/plan-reminder/server/services から直接 import して取得する。

// calendar のイベント（reminder 由来 plan）削除から呼ぶ Server Action。
// 'use server' の Action は Client から呼べる公開 I/F のため barrel re-export で安全。
export { deletePlanAction } from './actions';
export { AutoLinkText } from './components/auto-link-text';
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
