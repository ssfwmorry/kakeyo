import { requireAuth } from '@/features/auth/server/requireAuth';
import { getPlannedRecordList } from '@/features/planned-record/server/services';
import { getEffectivePairMode } from '@/lib/server/pair/mode';
import { PlannedRecordScreen } from '@/v2/features/planned-record/components/planned-record-screen';

// 設定 › 定期の記録（新デザイン）。

export default async function V2PlannedRecordPage() {
  const session = await requireAuth();
  const isPair = await getEffectivePairMode(session);
  const plannedRecordList = await getPlannedRecordList(session);

  return (
    <PlannedRecordScreen
      isPair={isPair}
      items={isPair ? plannedRecordList.pair : plannedRecordList.self}
    />
  );
}
