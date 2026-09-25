import { requireAuth } from '@/features/auth/server/requireAuth';
import { getColorClassifications } from '@/features/master/server/services';
import { getPlanTypeCardList } from '@/features/plan-reminder/server/services';
import { getEffectivePairMode } from '@/lib/server/pair/mode';
import { PlanTypeScreen } from '@/v2/features/plan-reminder/components/plan-type-screen';

// 設定 › 予定カテゴリ（新デザイン）。

export default async function V2PlanTypePage() {
  const session = await requireAuth();
  const isPair = await getEffectivePairMode(session);
  const [planTypeList, colors] = await Promise.all([
    getPlanTypeCardList(session),
    getColorClassifications(session)
  ]);

  return (
    <PlanTypeScreen
      colors={colors}
      isPair={isPair}
      planTypes={isPair ? planTypeList.pair : planTypeList.self}
    />
  );
}
