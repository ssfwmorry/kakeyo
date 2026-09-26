// plan-reminder feature の公開 API（barrel）。
// server-only（repositories / services / actions）は re-export しない。
// 公開するのは他 feature が使う部品（AutoLinkText）と FE 型のみ。
// データは @/features/plan-reminder/server/services から直接 import して取得する。
// server-only（repositories / services / actions）は re-export しない。
// 公開するのは画面 Client Component と FE 型のみ。
// - plan 画面ルート（app/(private)/plan/page.tsx）が PlanScreen を使う。
// - setting 統合は PlanSettingTab を配置し、データは
//   @/features/plan-reminder/server/services から直接 import して取得する。

export { AutoLinkText } from './components/auto-link-text';
export type {
  GroupedPlanTypeList,
  GroupedReminderList,
  PlanItem,
  PlanReminderError,
  PlanTypeCard,
  ReminderItem
} from './types';
