import { requireAuth } from '@/features/auth/server/requireAuth';
import { getColorClassifications } from '@/features/master/server/services';
import { getReminderList } from '@/features/plan-reminder/server/services';
import { getEffectivePairMode } from '@/lib/server/pair/mode';
import { todayJst } from '@/lib/shared/domain/date';
import { ReminderScreen } from '@/v2/features/reminder/components/reminder-screen';

// 設定 › リマインダー（新デザイン）。「これから」の判定基準は SSR で確定して渡す。
// リマインダーはモードに連動する（README D11）。

export default async function V2ReminderPage() {
  const session = await requireAuth();
  const isPair = await getEffectivePairMode(session);
  const [reminderList, colors] = await Promise.all([
    getReminderList(session),
    getColorClassifications(session)
  ]);

  return (
    <ReminderScreen
      colors={colors}
      isPair={isPair}
      reminders={isPair ? reminderList.pair : reminderList.self}
      today={todayJst()}
    />
  );
}
