import { planReminderLabels } from '../labels';
import type { GroupedPlanTypeList } from '../types';
import { PlanForm } from './plan-form';

// 予定入力画面（/plan）の本体。Server Component が組んだ plan_type 一覧・ペアモード・
// 初期日付を受け、PlanForm を配置する薄いラッパー（state を持たないため Server のまま。
// クライアント境界は PlanForm 側で張る）。
// 編集導線（既存 plan の受け渡し）は calendar 統合（P5）で URL パラメータ + 再取得により
// 渡す想定のため、ここでは新規作成の initialDate のみ受ける。

type PlanScreenProps = {
  planTypeList: GroupedPlanTypeList;
  isPair: boolean;
  initialDate?: string;
};

export function PlanScreen({
  planTypeList,
  isPair,
  initialDate
}: PlanScreenProps) {
  return (
    <div className='flex flex-col gap-4 p-4'>
      <h1 className='text-lg font-medium'>{planReminderLabels.heading.plan}</h1>
      <PlanForm
        planTypeList={planTypeList}
        isPair={isPair}
        initialDate={initialDate}
      />
    </div>
  );
}
