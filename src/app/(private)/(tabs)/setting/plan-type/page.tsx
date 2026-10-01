import { requireAuth } from '@/features/auth/server/requireAuth';
import { getColorClassifications } from '@/features/master/server/services';
import { PlanTypeScreen } from '@/features/plan-reminder/components/plan-type-screen';
import { getPlanTypeCardList } from '@/features/plan-reminder/server/services';
import { getEffectivePairMode } from '@/lib/server/pair/mode';

// この画面本体はまだセッション由来の取得を Suspense 境界へ落としていないため、
// サーバでブロックしてよい印を立てる（共通 layout の静的シェルは効いている）。
// 外すのは画面ごとの個別タスク。
export const instant = false;

// 設定 › 予定カテゴリ。

export default async function PlanTypePage() {
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
