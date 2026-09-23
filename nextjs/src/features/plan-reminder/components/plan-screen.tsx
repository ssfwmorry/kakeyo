import { planReminderLabels } from '../labels';
import type { GroupedPlanTypeList, PlanItem } from '../types';
import { PlanForm } from './plan-form';

// 予定入力画面（/plan）の本体。Server Component が組んだ plan_type 一覧・ペアモード・
// 初期日付を受け、PlanForm を配置する薄いラッパー（state を持たないため Server のまま。
// クライアント境界は PlanForm 側で張る）。
// calendar から ?planId= 付きで来た場合は editing に plan 1 件が渡り、PlanForm が
// 編集モード（プリフィル + 削除ボタン）になる。新規作成時は initialDate のみ受ける。

type PlanScreenProps = {
  planTypeList: GroupedPlanTypeList;
  isPair: boolean;
  editing?: PlanItem;
  initialDate?: string;
};

export function PlanScreen({
  planTypeList,
  isPair,
  editing,
  initialDate
}: PlanScreenProps) {
  return (
    <div className='flex flex-col gap-4 p-4'>
      <h1 className='text-lg font-medium'>{planReminderLabels.heading.plan}</h1>
      <PlanForm
        planTypeList={planTypeList}
        isPair={isPair}
        editing={editing}
        initialDate={initialDate}
      />
    </div>
  );
}
