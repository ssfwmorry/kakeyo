import { requireAuth } from '@/features/auth/server/requireAuth';
import { getColorClassifications } from '@/features/master/server/services';
import { ReminderScreen } from '@/features/plan-reminder/components/reminder-screen';
import { getReminderList } from '@/features/plan-reminder/server/services';
import { getEffectivePairMode } from '@/lib/server/pair/mode';
import { todayJst } from '@/lib/shared/domain/date';

// この画面本体はまだセッション由来の取得を Suspense 境界へ落としていないため、
// サーバでブロックしてよい印を立てる（共通 layout の静的シェルは効いている）。
// 外すのは画面ごとの個別タスク（docs/loading-ux/README.md）。
export const instant = false;

// 設定 › リマインダー。「これから」の判定基準は SSR で確定して渡す。
// リマインダーはモードに連動する（README D11）。

export default async function ReminderPage() {
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
