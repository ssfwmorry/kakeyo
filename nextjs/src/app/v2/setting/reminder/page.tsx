import { requireAuth } from '@/features/auth/server/requireAuth';
import { getReminderList } from '@/features/plan-reminder/server/services';
import { getEffectivePairMode } from '@/lib/server/pair/mode';
import { todayJst } from '@/lib/shared/domain/date';
import { ReminderScreen } from '@/v2/features/reminder/components/reminder-screen';

// 設定 › リマインダー（新デザイン）。
//
// 期日超過の判定基準は SSR で確定して渡す。クライアントの時計・端末 tz に委ねると
// 日付境界で「赤いのに超過扱いされない」等のズレが出るため。

export default async function V2ReminderPage() {
  const session = await requireAuth();
  const isPair = await getEffectivePairMode(session);
  const reminderList = await getReminderList(session);

  return (
    <ReminderScreen
      reminders={isPair ? reminderList.pair : reminderList.self}
      today={todayJst()}
    />
  );
}
