import { requireAuth } from '@/features/auth/server/requireAuth';
import { getBankList } from '@/features/bank/server/services';
import {
  getPlanTypeCardList,
  getReminderList
} from '@/features/plan-reminder/server/services';
import { getPlannedRecordList } from '@/features/planned-record/server/services';
import { SettingScreen } from '@/features/setting/components/setting-screen';
import {
  getMethodCardList,
  getTypeCardList
} from '@/features/type-method/server/services';
import { getEffectivePairMode } from '@/lib/server/pair/mode';

// 設定トップの薄いルート。
//
// トップは詳細画面への入口と件数しか出さないので、取得結果は件数に畳んで渡す。
// 一覧本体は各詳細画面（/setting/*）がそれぞれ取得する。

export default async function SettingPage() {
  const session = await requireAuth();
  const isPair = await getEffectivePairMode(session);

  // 口座（KakeiBank）は個人モード専用。共有モードでは取得せず行ごと出さない。
  const [
    typeList,
    methodList,
    plannedRecordList,
    planTypeList,
    reminderList,
    banks
  ] = await Promise.all([
    getTypeCardList(session),
    getMethodCardList(session),
    getPlannedRecordList(session),
    getPlanTypeCardList(session),
    getReminderList(session),
    isPair ? Promise.resolve(null) : getBankList(session)
  ]);

  // 件数は今のモード（個人 / 共有）のぶんだけ数える。
  const scope = isPair ? 'pair' : 'self';

  return (
    <SettingScreen
      bankCount={banks === null ? null : banks.length}
      hasPair={session.pairId !== null}
      isPair={isPair}
      methodCount={
        methodList.pay[scope].length +
        methodList.income[scope].length +
        methodList.both[scope].length
      }
      plannedRecordCount={plannedRecordList[scope].length}
      planTypeCount={planTypeList[scope].length}
      reminderCount={reminderList[scope].length}
      typeCount={typeList.pay[scope].length + typeList.income[scope].length}
    />
  );
}
