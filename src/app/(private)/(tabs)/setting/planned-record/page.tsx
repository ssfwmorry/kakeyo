import { Suspense } from 'react';
import { requireAuth } from '@/features/auth/server/requireAuth';
import { getDemoReferenceDate } from '@/features/demo/server/date';
import { PlannedRecordScreen } from '@/features/planned-record/components/planned-record-screen';
import {
  getDayClassifications,
  getPlannedRecordList
} from '@/features/planned-record/server/services';
import {
  getMethodCardList,
  getTypeCardList
} from '@/features/type-method/server/services';
import { getEffectivePairMode } from '@/lib/server/pair/mode';

// この画面本体はまだセッション由来の取得を Suspense 境界へ落としていないため、
// サーバでブロックしてよい印を立てる（共通 layout の静的シェルは効いている）。
// 外すのは画面ごとの個別タスク。
export const instant = false;

// 設定 › 定期の記録。追加・編集のシートが使う候補（カテゴリ・方法・毎月何日か）も
// ここで取る。

export default function PlannedRecordPage() {
  return (
    <Suspense fallback={<div className='flex-1' />}>
      <PlannedRecordPageContent />
    </Suspense>
  );
}

async function PlannedRecordPageContent() {
  const session = await requireAuth();
  const isPair = await getEffectivePairMode(session);
  const [plannedRecordList, typeList, methodList, dayClassifications] =
    await Promise.all([
      getPlannedRecordList(session),
      getTypeCardList(session),
      getMethodCardList(session),
      getDayClassifications(session)
    ]);

  return (
    <PlannedRecordScreen
      dayClassifications={dayClassifications}
      isPair={isPair}
      items={isPair ? plannedRecordList.pair : plannedRecordList.self}
      methodList={methodList}
      today={getDemoReferenceDate(session)}
      typeList={typeList}
    />
  );
}
