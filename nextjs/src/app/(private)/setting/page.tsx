import { requireAuth } from '@/features/auth/server/requireAuth';
import type { BankItem } from '@/features/bank';
import { getBankList } from '@/features/bank/server/services';
import { getColorClassificationList } from '@/features/master/server/repositories/colorClassification';
import {
  getPlanTypeCardList,
  getReminderList
} from '@/features/plan-reminder/server/services';
import { getPlannedRecordList } from '@/features/planned-record/server/services';
import {
  getMethodCardList,
  getTypeCardList
} from '@/features/type-method/server/services';
import { getPairMode } from '@/lib/server/pair/mode';
import { SettingTabs } from './setting-tabs';

// 設定画面（/setting）の薄いルート（Server Component）。fe-screens §SETTING の 3 タブ
// （家計管理 / 予定管理 / その他）を束ねる。実装済みの各設定タブ（他 feature の barrel）
// を SettingTabs（Client）で配置し、必要データは各 feature の server サービスから直接
// 取得して props で渡す（barrel は server-only を re-export しないため）。
// ヘッダ（リマインダー・ペア切替）とボトムナビは (private)/layout.tsx が担うため、
// ここはタブ本体のみを描画する。

export default async function SettingPage() {
  const session = await requireAuth();
  const pairMode = await getPairMode();
  // pairId が無ければ共有モードに関わらず個人スコープ固定（既存 page 群と同じ判定）。
  const isPair = session.pairId !== null && pairMode;

  // 口座（KakeiBank）は個人モード専用のため、ペア時は取得せず null にしてタブ内で非表示。
  const [
    typeList,
    methodList,
    plannedRecordList,
    planTypeList,
    reminderList,
    colors,
    banks
  ] = await Promise.all([
    getTypeCardList(session),
    getMethodCardList(session),
    getPlannedRecordList(session),
    getPlanTypeCardList(session),
    getReminderList(session),
    getColorClassificationList(),
    isPair ? Promise.resolve<BankItem[] | null>(null) : getBankList(session)
  ]);

  return (
    <SettingTabs
      typeList={typeList}
      methodList={methodList}
      plannedRecordList={plannedRecordList}
      banks={banks}
      planTypeList={planTypeList}
      reminderList={reminderList}
      colors={colors}
      isPair={isPair}
    />
  );
}
