import { Suspense } from 'react';
import { requireAuth } from '@/features/auth/server/requireAuth';
import { getDemoReferenceDate } from '@/features/demo/server/date';
import { getColorClassifications } from '@/features/master/server/services';
import { ReminderScreen } from '@/features/plan-reminder/components/reminder-screen';
import { getReminderList } from '@/features/plan-reminder/server/services';
import { getEffectivePairMode } from '@/lib/server/pair/mode';

// この画面本体はまだセッション由来の取得を Suspense 境界へ落としていないため、
// サーバでブロックしてよい印を立てる（共通 layout の静的シェルは効いている）。
// 外すのは画面ごとの個別タスク。
export const instant = false;

// 設定 › リマインダー。「これから」の判定基準は SSR で確定して渡す。
// リマインダーはモードに連動する（README D11）。

export default function ReminderPage() {
  return (
    <Suspense fallback={<div className='flex-1' />}>
      <ReminderPageContent />
    </Suspense>
  );
}

async function ReminderPageContent() {
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
      today={await getDemoReferenceDate(session)}
    />
  );
}
